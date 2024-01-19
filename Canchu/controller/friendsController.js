const friendsModel = require('../models/friendsModel');
const eventsModel = require('../models/eventsModel');
// Get Friends
//still working
exports.getFriends = (req, res, friendshipStatus) => {
  const userId = req.decodedToken.id;
  // Retrieve user's friends from the database
  friendsModel.friendInfo(friendshipStatus, userId)
        .then(results => {
          const friends = [];
          results.forEach((result) => {
            const friend = {
              id: result.id,
              name: result.name,
              picture: result.picture,
              friendship: {
                id: result.friendship_id,
                status: result.status
              }
            };

            friends.push(friend);
          });
          res.status(200).json({ data: { users: friends } });
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });
  };

// Get Pending Requests
exports.getPendingRequests = (req, res, status) => {
  // Retrieve user's friends from the database
  const receiverId = req.decodedToken.id;
  //console.log(`email:${req.decodedToken.email}, id${req.decodedToken.id}`);
  friendsModel.getPending(receiverId)
    .then(requestList => {
      //console.log(requestList.length);
      if(requestList.length == 0) {
          res.status(200).json({message: 'No friend request'});
      }
      else{
        const promises = requestList.map(async result => {
          const Id = parseInt(result.user1_id, 10);
          //console.log(result);
          const senderUser = await friendsModel.getUserById(result.user1_id);
          //console.log(senderUser[0]);
          
          const friend = {
            id: Id,
            name: senderUser[0].name,
            picture: senderUser[0].picture,
            friendship: {
              id: result.id,
              status: status
            }
          };
          return friend;
        });
        Promise.all(promises)
          .then(friends => {
            res.status(200).json({ data: { users: friends } });
          })
          .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
          });
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    });

};

//Send Friend Request
exports.sendFriendRequest = (req, res) => {
  const receiverId = parseInt(req.params.user_id, 10);
  const Token = req.decodedToken;
  const senderId = Token.id;
  const senderPicture = Token.picture;
  const senderName = Token.name;
  if (!isNaN(receiverId)) {
    // Check if the target user id is valid and exists in the system
    friendsModel.getUserById(receiverId)
      .then(userExists => {
        if (userExists == 0) {
          res.status(400).json({ error: 'User not found' });
        } else {
          // Check if the friendship request already exists
          friendsModel.checkFriendshipExists(senderId, receiverId)
            .then(friendshipExists => {
              if (friendshipExists > 0) {
                res.status(400).json({ error: 'Friendship request already sent' });
              } else {
                if (senderId == receiverId) {
                  res.status(400).json({ error: 'Cannot send request to yourself' });
                } else {
                  friendsModel.friendRequest(senderId, receiverId)
                    .then(results => {
                      const response = {
                        data: {
                          friendship: {
                            id: results.insertId // Example friendship ID
                          }
                        }
                      };
                      const event = 'invited you to be friends.'
                      eventsModel.insertEvent(receiverId, senderPicture, senderName, event);
                        /*.then(results => { 
                          console.log('successfully');
                        })
                        .catch(error => {
                          console.error(error);
                          res.status(500).json({ error: 'Server error' });
                        });*/
                      res.status(200).json(response);
                    })
                    .catch(error => {
                      console.error(error);
                      res.status(500).json({ error: 'Server error' });
                    });
                }
              }
            })
            .catch(error => {
              console.error(error);
              res.status(500).json({ error: 'Server error' });
            });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid user ID' });
  }

};

//Agree Friend Request
exports.agreeFriendRequest = (req, res) => {
  const Token = req.decodedToken;
  const receiverId = Token.id;
  const receiverPicture = Token.picture;
  const receiverName = Token.name;
  const friendshipId = parseInt(req.params.friendship_id, 10);
  if (!isNaN(friendshipId)) {
    // Check if the target id is valid and exists in the system
    //friendsModel.checkFriendshipId(friendshipId, receiverId, 'requested')
    friendsModel.checkFriendshipAgree(friendshipId, receiverId)
      .then(friendshipExists => {
        if (friendshipExists.length === 0 ) {
          res.status(400).json({ error: 'Invalid Request' });
        } else {
          friendsModel.updateFriendshipById(friendshipId)
          .then(results => {
            if (results.length == 0) {
              res.status(400).json({ error: 'Friendship not found' });
            } else {
                const response = {
                  data: {
                    friendship: {
                      id: friendshipId
                    }
                  }
                };
                const event = 'has accepted your friend request.'
                const senderId = friendshipExists[0].user1_id;
                eventsModel.insertEvent(senderId, receiverPicture, receiverName, event);
                res.status(200).json(response);
            }
          })
          .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
          });
            }
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid user ID' });
  }
};

//Delete Friend Request
exports.deleteFriendRequest = (req, res) => {
  const userId = req.decodedToken.id;
  const friendshipId = parseInt(req.params.friendship_id, 10);
  if (!isNaN(friendshipId)) {
    // Check if the target id is valid and exists in the system
    friendsModel.checkFriendshipDelete(friendshipId, userId)
      .then(friendshipExists => {
        if (friendshipExists == 0) {
          res.status(400).json({ error: 'Invalid Request' });
        } else {
          friendsModel.deleteFriendshipById(friendshipId)
          .then(results => {
            if (results.length == 0) {
              res.status(400).json({ error: 'Friendship not found' });
            } else {
                const response = {
                  data: {
                    friendship: {
                      id: friendshipId
                    }
                  }
                };
                res.status(200).json(response);
            }
          })
          .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
          });
            }
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid user ID' });
  }
};
  //module.exports = {getFriends, getPendingFriends, sendFriendRequest};
  
