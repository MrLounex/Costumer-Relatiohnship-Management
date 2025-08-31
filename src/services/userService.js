const userRepository = require("../repositories/userRepository");

exports.getAllUsers = () => userRepository.findAll();
exports.createUser = (data) => userRepository.create(data);
exports.getUserById = (id) => userRepository.findById(id);
exports.updateUser = (id, data) => userRepository.update(id, data);
exports.deleteUser = (id) => userRepository.remove(id);
