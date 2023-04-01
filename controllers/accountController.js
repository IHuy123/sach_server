exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.memberBoard = (req, res) => {
  res.status(200).send("Member Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");

};

exports.authorBoard = (req, res) => {
  res.status(200).send("Author Content.");
};
exports.reviewerBoard = (req, res) => {
  res.status(200).send("Reviewer Content.");
};
exports.editorBoard = (req, res) => {
  res.status(200).send("Editor Content.");
};
exports.editorInChiefBoard = (req, res) => {
  res.status(200).send("Editor in chief Content.");
};