let users = [];

exports.findAll = () => users;

exports.create = (data) => {
  const newUser = { id: Date.now().toString(), ...data };
  users.push(newUser);
  return newUser;
};

exports.findById = (id) => users.find((u) => u.id === id);

exports.update = (id, data) => {
  const index = users.findIndex((u) => u.id === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...data };
    return users[index];
  }
  return null;
};

exports.remove = (id) => {
  users = users.filter((u) => u.id !== id);
};
