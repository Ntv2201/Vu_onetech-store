const mongoose = require('mongoose');
async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/onetech_store');
  const desc = mongoose.connection.client.topology.s.description;
  console.log("Topology type:", desc.type);
  process.exit(0);
}
check();
