var mysql = require('mysql');

module.exports = (function(){
    var pool = mysql.createPool({
        host:'localhost',
        user:'root',
        password:'835081',
        database:'birthday',
        port:'3306'
    });
    pool.on('connection',function(connection){
        connection.query('SET SESSION auto_increment_increment=1');
    });
    return function(){      //返回唯一的一个pool
        return pool;
    }
})();