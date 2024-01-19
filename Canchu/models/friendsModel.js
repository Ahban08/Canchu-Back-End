//require the mysql package and create a MySQL connection
const mysql = require('mysql2'); //mysql

//import dotenv from 'dotenv'
const dotenv = require('dotenv');
dotenv.config()

//import bcrypt from 'bcryptjs'
//const bcrypt = require('bcrypt');

// Create a MySQL connection
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,//'canchu_mysql'// 資料庫主機位址
  user: process.env.MYSQL_USER,//'root'// 資料庫使用者名稱
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});
exports.connection = connection;

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL server');
});


// ------FRIENDSMODELS------
exports.getUserById = (userId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM `users` WHERE `id` = ?';
    connection.query(query, [userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
         //console.log(results);
        resolve(results);
      }
    });
  });
};

/*exports.getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id FROM `users` WHERE `email` = ?';
    connection.query(query, [email], (error, results) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        if (results.length > 0) {
          const id = results[0].id;
          resolve(id);
        } else {
          resolve(null);
        }
      }
    });
  });
};*/

exports.checkFriendshipExists =(senderId, receiverId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT COUNT(*) FROM `friendship` \
    WHERE (`user1_id` = ? AND `user2_id` = ?) \
    OR (`user1_id` = ? AND `user2_id` = ?)';
    connection.query(query, [senderId, receiverId, receiverId, senderId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        const count = results[0]['COUNT(*)'];
        //console.log(count);
        resolve(count);
      }
    });
  });
}

exports.friendInfo = (status, userId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT u.id, u.name, u.picture, f.id AS friendship_id, f.status\
    FROM users u\
    LEFT JOIN friendship f ON u.id IN (f.user1_id, f.user2_id)\
    WHERE (f.status = ? AND (f.user1_id = ? OR f.user2_id = ?))\
    AND u.id <> ?';
    connection.query(query, [ status, userId, userId, userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        console.log(results);
        resolve(results);
      }
    });
  });
};

exports.getPending = (userId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM `friendship` WHERE `user2_id` = ? AND `status` = ? ORDER BY friendship.id DESC';
    //const query2 = 'SELECT * FROM users WHERE id = ?';
    /*const query2 = 'SELECT u.user2_id, u.name, u.picture, f.id \
                  FROM users u \
                  INNER JOIN friends f ON user2_id = ? \
                  WHERE f.status = ?';*/
    connection.query(query, [userId, 'requested'], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

exports.friendRequest = (senderId, receiverId) => {
  return new Promise((resolve, reject) => {
    const query = 'INSERT INTO friendship (user1_id, user2_id, status) VALUES (?, ?, ?)';
    connection.query(query, [senderId, receiverId, 'requested'], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

exports.checkFriendshipAgree =(friendshipId, receiverId) => {
  return new Promise((resolve, reject) => {
    const query = 'SELECT user1_id FROM friendship WHERE id = ? AND user2_id = ?';
    connection.query(query, [friendshipId, receiverId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        //const count = results[0]['COUNT(*)'];
        //console.log(count);
        resolve(results);
      }
    });
  });
}

exports.checkFriendshipDelete =(friendshipId, userId) => {
  return new Promise((resolve, reject) => {
    //const query = 'SELECT COUNT(*) FROM friendship WHERE id = ? AND user2_id = ? AND status = ?';
    //const query = 'SELECT COUNT(*) FROM friendship WHERE id = ? AND user2_id = ?';
    const query = 'SELECT COUNT(*) FROM friendship WHERE id = ? AND \
    (`user1_id` = ? OR `user2_id` = ?) ';
    connection.query(query, [friendshipId, userId, userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        const count = results[0]['COUNT(*)'];
        console.log(count);
        resolve(count);
      }
    });
  });
}

exports.updateFriendshipById = (friendshipId) => {
  return new Promise((resolve, reject) => {
    const query = 'UPDATE friendship SET status = "friend" \
    WHERE id = ?';
    connection.query(query, [friendshipId], (error, results) => {
      if (error) {
        reject(error);
      } else {
         //console.log(results);
        resolve(results);
      }
    });
  });
};

exports.deleteFriendshipById = (friendshipId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM friendship WHERE id = ?';
    connection.query(query, [friendshipId], (error, results) => {
      if (error) {
        reject(error);
      } else {
         //console.log(results);
        resolve(results);
      }
    });
  });
};