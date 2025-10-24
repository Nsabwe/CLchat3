const socket = io();
let currentReceiver = null;
const privateChats = {};
const unreadMessages = {};

const loginContainer = document.getElementById("login-container");
const usernameInput = document.getElementById("username-input");
const loginBtn = document.getElementById("login-btn");

const chatContainer = document.querySelector(".chat-container");
const userList = document.getElementById("user-list");
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");

const privateChat = document.getElementById("private-chat");
const privateTabs = document.getElementById("private-tabs");
const privateTitle = document.getElementById("private-title");
const privateMessages = document.getElementById("private-messages");
const privateForm = document.getElementById("private-form");
const privateInput = document.getElementById("private-input");

// Login
loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (!username) return alert("Enter username");
  localStorage.setItem("username", username);
  loginContainer.style.display = "none";
  chatContainer.style.display = "flex";
  socket.emit("user joined", username);
});

// Public chat
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!input.value) return;
  const sender = localStorage.getItem("username");
  const msg = { sender, text: input.value };
  socket.emit("chat message", msg);
  input.value = "";
});

socket.on("chat message", (msg) => {
  const li = document.createElement("li");
  li.textContent = `${msg.sender}: ${msg.text}`;
  messages.appendChild(li);
});

// Sidebar / Users
socket.on("users list", (users) => {
  userList.innerHTML = "";
  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.username;
    userList.appendChild(li);
  });
});

// Click user → open private chat tab
userList.addEventListener("click", async (e) => {
  if (e.target.tagName !== "LI") return;
  const username = e.target.textContent.split(" (")[0];
  if (username === localStorage.getItem("username")) return;

  // Reset unread
  unreadMessages[username] = 0;

  // Load previous messages if not loaded
  if (!privateChats[username]) {
    const res = await fetch(`/api/messages/${localStorage.getItem("username")}/${username}`);
    privateChats[username] = await res.json();
  }

  openPrivateChat(username);
});

// Open / render tab
function openPrivateChat(username) {
  currentReceiver = username;
  privateChat.style.display = "block";
  renderTabs();
  renderMessages(username);
}

// Render tabs
function renderTabs() {
  privateTabs.innerHTML = "";
  for (const user in privateChats) {
    const tab = document.createElement("div");
    tab.className = "tab" + (user === currentReceiver ? " active" : "");
    let count = unreadMessages[user] || 0;
    tab.textContent = count > 0 ? `${user} (${count})` : user;
    tab.addEventListener("click", () => {
      currentReceiver = user;
      unreadMessages[user] = 0;
      renderTabs();
      renderMessages(user);
    });
    privateTabs.appendChild(tab);
  }
}

// Render messages for a chat
function renderMessages(username) {
  privateMessages.innerHTML = "";
  privateChats[username].forEach(msg => {
    const li = document.createElement("li");
    li.textContent = `${msg.sender}: ${msg.text}`;
    privateMessages.appendChild(li);
  });
}

// Send private message
privateForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentReceiver || !privateInput.value) return;
  const msg = { sender: localStorage.getItem("username"), receiver: currentReceiver, text: privateInput.value };
  socket.emit("private message", msg);
  privateInput.value = "";
});

// Receive private message
socket.on("private message", (msg) => {
  const sender = msg.sender;
  const receiver = msg.receiver;
  const chatUser = sender === localStorage.getItem("username") ? receiver : sender;

  if (!privateChats[chatUser]) privateChats[chatUser] = [];
  privateChats[chatUser].push(msg);

  if (chatUser === currentReceiver) {
    const li = document.createElement("li");
    li.textContent = `${msg.sender}: ${msg.text}`;
    privateMessages.appendChild(li);
  } else {
    unreadMessages[chatUser] = (un