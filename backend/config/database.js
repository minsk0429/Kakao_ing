const mysql = require('mysql2');

// MySQL 데이터베이스 연결 설정
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '211711',
  database: 'kakaotalk_clone'
});

// 연결 확인
connection.connect((err) => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err);
    return;
  }
  console.log('MySQL 데이터베이스에 연결되었습니다.');
});

module.exports = connection;