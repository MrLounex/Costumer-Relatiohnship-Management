const userService = require("../services/userService");

exports.getAllUsers = async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
};

exports.createUser = async (req, res) => {
  const newUser = await userService.createUser(req.body);
  res.json(newUser);
};

exports.getUserById = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json(user);
};

exports.updateUser = async (req, res) => {
  const updatedUser = await userService.updateUser(req.params.id, req.body);
  res.json(updatedUser);
};

exports.deleteUser = async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.json({ message: "User deleted" });
};
