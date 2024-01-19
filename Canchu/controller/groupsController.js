const groupsModel = require('../models/groupsModel');

//Set Timezone
const moment = require('moment-timezone'); 
moment.tz.setDefault("Asia/Taipei");

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.decodedToken.id;
    if (name){
        groupsModel.insertGroup(name, userId)
        .then(results => {
          groupsModel.memberRequest(results.insertId, userId, 'member')
            .then( )
            .catch(error => {
              console.error(error);
              res.status(500).json({ error: 'Server error' });
            });
            const response = {
              data: {
                group: {
                  id: results.insertId
                }
              }
            };
            res.status(200).json(response);
          })
          .catch(error => {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
          });
    }else{
        res.status(400).json({ error: 'Invaild group name.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const groupId = parseInt(req.params.group_id, 10);
    const userId = req.decodedToken.id;
    if (!isNaN(groupId)) {
      groupsModel.checkGroupExists(groupId)
        .then(groupExists => {
          if(groupExists.length){
            groupsModel.deleteGroup(groupId, userId)
            .then(results => {
              if(results.affectedRows == 1){
                const response = {
                  data: {
                    group: {
                      id: groupId
                    }
                  }
                };
                res.status(200).json(response);
              }else{
                res.status(400).json({ error: 'User has no permission.' });
              }
            })
            .catch(error => {
              console.error(error);
              res.status(500).json({ error: 'Server error' });
            });
          }else{
            res.status(400).json({ error: 'Group does not exist.' });
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });
      
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid group ID' });
  }
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

//Send Member Request
exports.sendMemberRequest = (req, res) => {
  const groupId = parseInt(req.params.group_id, 10);
  const Token = req.decodedToken;
  const userId = Token.id;
  if (!isNaN(groupId)) {
    groupsModel.checkGroupExists(groupId)
        .then(groupExists => {
          if(groupExists.length){
            groupsModel.checkMembershipStatus(groupId, userId)
            .then(membershipStatus => {
              if (membershipStatus.length > 0) {
                if(membershipStatus[0].status == 'requested'){
                  res.status(400).json({ error: 'Membership request already sent' });
                }else{
                  res.status(400).json({ error: 'You are member.' });
                }    
              } else {
                groupsModel.memberRequest(groupId, userId, 'requested')
                  .then(results => {
                    const response = {
                      data: {
                        group: {
                          id: results.insertId 
                        }
                      }
                    };
                    res.status(200).json(response);
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
          }else{
            res.status(400).json({ error: 'Group does not exist.' });
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid group ID' });
  }

};

// Get Pending Requests
exports.getPendingRequests = (req, res, status) => {
  const groupId = parseInt(req.params.group_id, 10);
  const Token = req.decodedToken;
  const userId = Token.id;
  if (!isNaN(groupId)) {
    groupsModel.checkGroupExists(groupId)
        .then(groupExists => {
          if(groupExists[0].userId == userId){
            groupsModel.getPending(groupId, 'requested')
              .then(requestList => {
                if(requestList.length == 0) {
                    res.status(200).json({message: 'No member request'});
                }
                else{
                  const promises = requestList.map(async result => {
                    const applicantId = parseInt(result.userId, 10);
                    const applicant = await groupsModel.getUserById(applicantId);
                    const member = {
                      id: applicant[0].id,
                      name: applicant[0].name,
                      picture: applicant[0].picture,
                      status: status
                    };
                    return member;
                  });
                  Promise.all(promises)
                    .then(members => {
                      res.status(200).json({ data: { users: members } });
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
          }else{
            res.status(400).json({ error: 'Group does not exist or user has no permission.' });
          }
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Server error' });
        });
    } else {
      // Handle the case where req.params.id is not a valid number
      res.status(400).json({ error: 'Invalid group ID' });
    }  
};

//Agree Member Request
exports.agreeMemberRequest = (req, res) => {
  const Token = req.decodedToken;
  const userId = Token.id;
  const groupId = parseInt(req.params.group_id, 10);
  const applicantId = parseInt(req.params.user_id, 10);
  if (!isNaN(groupId) && !isNaN(applicantId)) {
    groupsModel.checkGroupExists(groupId)
        .then(groupExists => {
          if(groupExists[0].userId == userId){
            groupsModel.getUserById(applicantId)
              .then(userExists => {
                if (userExists.length) {
                  groupsModel.updateMembership(groupId, applicantId, 'member')
                  .then(results => {
                    if (results.changedRows > 0) {
                      const response = {
                        data: {
                          user: {
                            id: applicantId
                          }
                        }
                      };
                      res.status(200).json(response);
                    } else {
                      res.status(400).json({ error: 'Request not found' });
                    }
                  })
                  .catch(error => {
                    console.error(error);
                    res.status(500).json({ error: 'Server error' });
                  });
                }else {
                  res.status(400).json({ error: 'Invalid applicant ID' });
                }
              })
              .catch(error => {
                console.error(error);
                res.status(500).json({ error: 'Server error' });
              });            
          } else {
            res.status(400).json({ error: 'Group does not exist or user has no permission.' });
          }
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid group ID or applicant ID' });
  }
};

//Create Post
exports.createPost = (req, res) => {
  const {context} = req.body;
  const userId = req.decodedToken.id;
  const groupId = parseInt(req.params.group_id, 10);
  if (!isNaN(groupId)) {
    groupsModel.checkGroupExists(groupId)
      .then(groupExists => {
        if(groupExists.length){
          groupsModel.checkMembership(groupId, userId, 'member')
            .then(memberExists => {
              if(memberExists){
                if(context){
                  groupsModel.insertPost(groupId, userId, context)
                  .then(results => {
                    const response = {
                      data: {
                        group: {
                          id: groupId
                        },
                        user: {
                          id: userId
                        },
                        post: {
                          id: results.insertId
                        },
                      }
                    };
                    res.status(200).json(response);
                  })
                  .catch(error => {
                    console.error(error);
                    res.status(500).json({ error: 'Server error' });
                  });
                }else {
                  res.status(400).json({ error: 'Context is empty.' });
                }
              }else{
                res.status(400).json({ error: 'Do not have permission.' });
              }
            })
            .catch(error => {
              console.error(error);
              res.status(500).json({ error: 'Server error' });
            });
          }else{
            res.status(400).json({ error: 'Group does not exist.' });
          }
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      });
  } else {
    // Handle the case where req.params.id is not a valid number
    res.status(400).json({ error: 'Invalid group ID' });
  }
};

// Get Posts
exports.getPosts = (req, res) => {
  const userId = req.decodedToken.id;
  const groupId = parseInt(req.params.group_id, 10);
  if (!isNaN(groupId)) {
    groupsModel.checkGroupExists(groupId)
      .then(groupExists => {
        if(groupExists.length){
          groupsModel.checkMembership(groupId, userId, 'member')
            .then(memberExists => {
              if(memberExists){
                groupsModel.getPostDetails(groupId)
                  .then(postList => {
                    const promises = postList.map(async result => {
                      const commemtTaipeiDateTime = moment.utc(result.created_at).tz('Asia/Taipei');
                      const commemtFormattedDateTime = commemtTaipeiDateTime.format('YYYY-MM-DD HH:mm:ss');
                      const post = {
                        id: result.id,
                        user_id: result.userId,
                        created_at: commemtFormattedDateTime,
                        context: result.context,
                        is_liked: result.is_liked,
                        like_count: result.like_count,
                        comment_count: result.comment_count,
                        picture: result.picture,
                        name: result.name,
                      };
                      return post;
                    });
                    Promise.all(promises)
                      .then(posts => {
                        const response = {
                          data: {
                            posts: posts
                          }
                        };
                        res.status(200).json( response );
                      })
                      .catch(error => {
                        console.error(error);
                        res.status(500).json({ error: 'Server error' });
                      });
                  })
                  .catch(error => {
                    console.error(error);
                    res.status(500).json({ error: 'Server error' });
                  });
              }else{
                res.status(400).json({ error: 'Do not have permission.' });
              }
            })
            .catch(error => {
              console.error(error);
              res.status(500).json({ error: 'Server error' });
            });
        }else{
          res.status(400).json({ error: 'Group does not exist.' });
        }
      })
      .catch(error => {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      });
} else {
// Handle the case where req.params.id is not a valid number
res.status(400).json({ error: 'Invalid group ID' });
}

};

