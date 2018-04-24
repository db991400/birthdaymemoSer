var express = require('express');
var router = express.Router();
var connPool = require('../db/dbconnpool');
var fs = require('fs');
var multiparty = require('multiparty');
var path = require('path');
var jwt = require('jsonwebtoken');
var pool = connPool();

//获取userid
function getId(req) {
    //解析token信息，并获取useid
    let token = (req.headers['authorization'].split(' '))[1];
    let decodeToken = jwt.decode(token, {
        complete: true
    });
    return decodeToken.payload['userid'];
}

router.get('/', function (req, res) {
    res.render('friends');
});
var friendList = [];
router.get('/friend-list', function (req, res) {

    //console.log(decodeToken.payload);
    const id = getId(req);
    let sqlStr = "select * from friend where uid=? and state='normal'";
    pool.getConnection(function (err, conn) {
        if (err) {
            res.status(400).json({
                code: '-200',
                msg: '数据库连接失败！'
            });
            return;
        }
        conn.query(sqlStr, [id], function (err, rs) {
            if (err) {
                console.log('Error Message: ' + err.message);
                res.status(400).json({
                    code: '-200',
                    msg: '查询好友列表出错：' + err.message
                });
                return;
            }
            if (rs.length === 0) {
                res.status(200).json({
                    code: '-200',
                    msg: '您暂时没有好友列表，请先添加好友！'
                });
                return;
            }
            friendList = rs;
            res.send({
                code: '200',
                results: rs
            });
        });
        conn.release();
    });
});
//修改、新建、删除好友信息
router.post('/editfriend', function (req, res) {
    console.log(friendList);
    let sqlStr = ``;
    let params = [];
    const friend = req.body['value'];
    const fphoto = friend.photo.slice(friend.photo.indexOf('/images'));
    const birth = new Date(friend.fbirth);
    //console.log(friend);
    if (req.body['operate'] == 'edit') {
        sqlStr = 'update friend set fname=?,fbirth=?,fpnumber=?,femail=?,fgroup=?,photo=? where fid=?';
        params = [friend.fname, birth, friend.fnumber, friend.femail, friend.fgroup, fphoto, friend.fid];
    } else if (req.body['operate'] == 'new') {
        //当新建好友时，检查当前用户列表中是否有重复的名字
        if(friendList.findIndex(fr=>
            fr.fname === friend.fname && fr.uid === getId(req)) >= 0){
            console.log('此用户已经创建过相同名称的好友了！');
            res.status(400).json({code:'-200', msg:'您已经添加过该好友了！'});
            return;
        }
        sqlStr = `insert into friend (fname, fbirth, fpnumber,femail,fgroup, uid, state, photo)
    values(?,?,?,?,?,?,'normal',?)`;
        params = [friend.fname, birth, friend.fnumber, friend.femail, friend.fgroup, getId(req), fphoto];
    } else if (req.body['operate'] == 'delete') {
        sqlStr = "delete from friend where fid=?";
        params = [friend.fid];
    }
    pool.getConnection(function (err, conn) {
        if (err) {
            res.status(400).json({
                code: '-200',
                msg: '数据库连接失败！'
            });
            return;
        }
        conn.query(sqlStr, params, function (err, rs) {
            if (err) {
                console.log(err.message);
                res.status(400).json({
                    code: '-200',
                    msg: '修改好友信息出错：' + err.message
                });
                return;
            }
            res.status(200).json({
                code: '200',
                msg: 'Edit Friend success!'
            });
        });
        conn.release();
    });

    /*  
    res.status(200).json({
        code:'200',
        msg:'Edit Friend success!'
    });*/
});
//上传照片响应
router.post('/updateImg', function (req, res) {
    var filePath = '';
    //生成multiparty对象，并配置上传目标路径
    var form = new multiparty.Form({
        uploadDir: './public/images'
    });
    //上传完成后的处理
    form.parse(req, function (err, fields, files) {
        var fileTmp = JSON.stringify(files, null, 2);
        if (err) {
            console.log('parse error: ' + err);
            res.end('文件上传发生错误' + err);
            return;
        }
        //console.log('parse files: ' + fileTmp);
        var inputFile = files.file[0]; //上传的文件
        var uploadedPath = inputFile.path; //上传文件的路径
        //用原文件名拼接文件路径
        var dstPath = './public/images/' + inputFile.originalFilename;
        console.log('dstPath' + dstPath);
        //重命名为真实文件
        fs.rename(uploadedPath, dstPath, function (err) {
            if (err) {
                console.log('重命名文件失败！');
                return;
            } else {
                filePath = '/images/' + inputFile.originalFilename;
                console.log('filePath:' + filePath);
                res.status(200).send(filePath);
            }
        });
        /* filePath = filePath.substr(filePath.indexOf('\images') - 1).replace(/\\/g, '\/');
        console.log(filePath); */

    });
});
module.exports = router;