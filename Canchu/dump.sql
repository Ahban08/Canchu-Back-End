CREATE DATABASE IF NOT EXISTS Canchu;
USE Canchu;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(255),
  email VARCHAR(255),
  name VARCHAR(255),
  picture VARCHAR(255),
  password VARCHAR(255),
  introduction TEXT,
  tags VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS friendship (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user1_id VARCHAR(255),
  user2_id VARCHAR(255),
  status VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  type VARCHAR(255),
  image VARCHAR(255),
  summary TEXT,
  is_read BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Create the 'posts' table
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  context TEXT,
  summary TEXT,
  is_liked Boolean,
  like_count INT,
  comment_count INT,
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create the 'comments' table
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  content TEXT,
  post_id INT,
  user_id INT,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create the 'likes' table
CREATE TABLE IF NOT EXISTS likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT,
  user_id INT
  );

CREATE TABLE IF NOT EXISTS groups_ (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  userId INT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS membership(
  id INT AUTO_INCREMENT PRIMARY KEY,
  groupId INT NOT NULL,
  userId INT NOT NULL,
  status VARCHAR(50),
  FOREIGN KEY (userId) REFERENCES users(id)ON DELETE CASCADE,
  FOREIGN KEY (groupId) REFERENCES groups_(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS groupPosts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  groupId INT NOT NULL,
  userId INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  context TEXT,
  is_liked BOOLEAN,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (groupId) REFERENCES groups_(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message TEXT,
  senderId INT NOT NULL,
  receiverId INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
);