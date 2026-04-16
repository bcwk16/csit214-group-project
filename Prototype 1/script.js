// ===================== DOM ELEMENTS =====================
const DOM = {
  // Login Page
  loginForm: document.getElementById("loginForm"),
  role: document.getElementById("role"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),

  // Staff Page
  roomTable: document.getElementById("roomTable"),
  submitBtn: document.getElementById("submitBtn"),
  backBtn: document.getElementById("backBtn"),

  // Staff Room Form fields
  modalTitle: document.getElementById("modalTitle"),
  roomForm: document.getElementById("roomForm"),
  roomName: document.getElementById("roomName"),
  capacity: document.getElementById("capacity"),
  price: document.getElementById("price"),
  promo: document.getElementById("promo"),
  roomDate: document.getElementById("roomDate"),
  roomStartTime: document.getElementById("roomStartTime"),
  roomEndTime: document.getElementById("roomEndTime"),

  // Student Page
  walletBalance: document.getElementById("walletBalance"),
  availableRooms: document.getElementById("availableRooms"),
  studentBookings: document.getElementById("studentBookings"),
};


// =================== LocalStorage Database ===================
const database = {
  config: {
    keys: { users: "users", rooms: "rooms", bookings: "bookings" },
    slotDuration: 1,
    defaults: {
      users: {
        staff: { username: "admin", password: "admin" },
        students: [
          { id: "s01", username: "user1", password: "user1", wallet: 100 },
          { id: "s02", username: "user2", password: "user2", wallet: 200 },
        ],
      },
      rooms: [
        {
          id: "01",
          name: "UOW Seminar Room A",
          capacity: 20,
          price: 50,
          promo: "WELCOME10",
          date: "20-04-2026",
          startTime: "09:00",
          endTime: "12:00",
          status: true,
        },
        {
          id: "02",
          name: "UOW Seminar Room B",
          capacity: 15,
          price: 40,
          promo: "SPRING20",
          date: "22-04-2026",
          startTime: "13:00",
          endTime: "16:00",
          status: false,
        },
      ],
      bookings: [],
    },
    pages: { staff: "staff.html", student: "student.html" },
  },

  get: (k) => JSON.parse(localStorage.getItem(k)),
  set: (k, v) => {
    localStorage.setItem(k, JSON.stringify(v));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: k,
        newValue: JSON.stringify(v),
        oldValue: localStorage.getItem(k),
      }),
    );
  },

  init() {
    const { keys, defaults } = this.config;
    Object.entries(defaults).forEach(([k, v]) => {
      if (!localStorage.getItem(keys[k])) this.set(keys[k], v);
    });
    this.users = this.get(keys.users);
    this.rooms = this.get(keys.rooms);
    this.bookings = this.get(keys.bookings);
  },

  saveRoom(room) {
    const maxId = this.rooms.reduce((m, r) => Math.max(m, +r.id), 0);
    room.id = String(maxId + 1).padStart(2, "0");
    this.rooms.push(room);
    this.set(this.config.keys.rooms, this.rooms);
  },

  wallet: {
    get: () => {
      const id = sessionStorage.getItem("currentStudentId");
      const student = database.users.students.find((s) => s.id === id);
      return student ? student.wallet : 0;
    },
    set: (val) => {
      const id = sessionStorage.getItem("currentStudentId");
      const student = database.users.students.find((s) => s.id === id);
      if (student) {
        student.wallet = val;
        database.set(database.config.keys.users, database.users);
        database.wallet.render();
      }
    },
    render: () => {
      if (DOM.walletBalance) {
        DOM.walletBalance.textContent = database.wallet.get();
      }
    },
    deposit: (amt = 50) => {
      const oldBalance = database.wallet.get();
      const newBalance = oldBalance + amt;
      database.wallet.set(newBalance);
      alert(
        `Deposit Successful! \n\nAmount deposited: $${amt}\nPrevious balance: $${oldBalance}\nNew balance: $${newBalance}`,
      );
      return newBalance;
    },
  },
  users: {},
  rooms: [],
  bookings: [],
};
database.init();

// ===================== REAL-TIME SYNC =====================
window.addEventListener("storage", (e) => {
  if (
    [
      database.config.keys.bookings,
      database.config.keys.rooms,
      database.config.keys.users,
    ].includes(e.key)
  ) {
    database.bookings = database.get(database.config.keys.bookings);
    database.rooms = database.get(database.config.keys.rooms);
    database.users = database.get(database.config.keys.users);
    if (DOM.roomTable) renderRooms();
    if (DOM.availableRooms) renderAvailableRooms();
    if (DOM.studentBookings) renderStudentBookings();
    if (DOM.walletBalance) database.wallet.render();
  }

  if (e.key === "refundNotification" && e.newValue) {
    try {
      const payload = JSON.parse(e.newValue);
      const currentStudentId = sessionStorage.getItem("currentStudentId");
      if (
        payload?.studentIds?.includes(currentStudentId) &&
        typeof payload.totalAmount === "number"
      ) {
        alert(
          `Your booking for room "${payload.roomName}" was cancelled. $${payload.totalAmount} has been refunded back to your account.`,
        );
      }
    } catch (error) {
      console.error("Failed to parse refund notification:", error);
    }
  }
});

// ===================== UTILS =====================
const formatTime = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const getEndTime = (startTime) => {
  const [hour, min] = startTime.split(":").map(Number);
  const totalMin = hour * 60 + min + database.config.slotDuration * 60;
  return formatTime(totalMin);
};

const generateSlots = (start, end) => {
  let [startHour, startMin] = start.split(":").map(Number);
  let [endHour, endMin] = end.split(":").map(Number);

  let slots = [];
  let step = database.config.slotDuration * 60;
  let currentMin = startHour * 60 + startMin;
  let finMin = endHour * 60 + endMin;

  // For overnight bookings, add 24 hours to end time
  let maxMin = finMin;
  if (finMin <= currentMin) {
    maxMin = finMin + 24 * 60;
  }

  // Generate slots
  while (currentMin + step <= maxMin) {
    let displayHour = Math.floor((currentMin % (24 * 60)) / 60);
    let displayMin = currentMin % 60;
    slots.push(
      `${String(displayHour).padStart(2, "0")}:${String(displayMin).padStart(2, "0")}`,
    );
    currentMin += step;
  }

  return slots;
};

// ===================== LOGIN =====================
if (DOM.loginForm) {
  DOM.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const role = DOM.role.value;
    const username = DOM.username.value.trim();
    const password = DOM.password.value.trim();

    if (!role) return alert("Please select a role.");

    let account = null;
    if (role === "staff") {
      if (
        username === database.users.staff.username &&
        password === database.users.staff.password
      ) {
        account = database.users.staff;
      }
    } else if (role === "student") {
      account = database.users.students.find(
        (s) => s.username === username && s.password === password,
      );
    }

    if (account) {
      sessionStorage.setItem("currentUserRole", role);
      if (role === "student")
        sessionStorage.setItem("currentStudentId", account.id);
      window.location.href = database.config.pages[role];
    } else {
      alert("Invalid username or password for selected role.");
    }
  });
}



// ===================== STAFF =====================
const updateRooms = () => {
  database.set(database.config.keys.rooms, database.rooms);
  renderRooms();
};

const roomRow = (r, i) => `
  <tr>
    <td>${r.name}</td>
    <td>${r.capacity}</td>
    <td>${r.price}</td>
    <td>${r.promo}</td>
    <td>${r.date}</td>
    <td>${r.startTime}</td>
    <td>${r.endTime}</td>
    <td>${r.status ? "Available" : "Unavailable"}</td>
    <td>
      <button data-action="toggle" data-index="${i}">${r.status ? "Unlaunch" : "Launch"}</button>
      <button data-action="edit" data-index="${i}">Edit</button>
      <button data-action="delete" data-index="${i}">Delete</button>
    </td>
  </tr>`;

const renderRooms = () => {
  if (DOM.roomTable)
    DOM.roomTable.innerHTML = database.rooms.map(roomRow).join("");
};

const notifyRefundedStudents = (roomName, totalAmount, studentIds) => {
  localStorage.setItem(
    "refundNotification",
    JSON.stringify({ roomName, totalAmount, studentIds, timestamp: Date.now() }),
  );
};

// Refund all bookings for a room when it's unlaunched
const refundBookingsForRoom = (roomId) => {
  let currentBookings = database.get(database.config.keys.bookings) || [];
  const affectedBookings = currentBookings.filter((b) => b.roomId === roomId);
  if (!affectedBookings.length) return;

  affectedBookings.forEach((booking) => {
    const student = database.users.students.find((s) => s.id === booking.studentId);
    if (student) student.wallet += booking.price;
  });

  const room = database.rooms.find((r) => r.id === roomId);
  const totalAmount = affectedBookings.reduce((sum, booking) => sum + booking.price, 0);
  const studentIds = [...new Set(affectedBookings.map((b) => b.studentId))];
  notifyRefundedStudents(room?.name || "Room", totalAmount, studentIds);

  const remainingBookings = currentBookings.filter((b) => b.roomId !== roomId);
  database.bookings = remainingBookings;
  database.set(database.config.keys.users, database.users);
  database.set(database.config.keys.bookings, remainingBookings);
};

document.addEventListener("click", (e) => {
  const { action, index } = e.target.dataset || {};
  if (index === undefined) return;

  switch (action) {
    case "toggle":
      const room = database.rooms[index];
      room.status = !room.status;
      if (!room.status) {
        refundBookingsForRoom(room.id);
      }
      updateRooms();
      break;
    case "edit":
      localStorage.setItem("editRoomIndex", index);
      window.location.href = "form.html";
      return;
    case "delete":
      if (confirm("Delete room?")) {
        const roomToDelete = database.rooms[index];
        refundBookingsForRoom(roomToDelete.id);
        database.rooms.splice(index, 1);
      }
      updateRooms();
      break;
  }
});

// ===================== STAFF Room Form =====================
if (DOM.roomForm) {
  const editIndex = localStorage.getItem("editRoomIndex");
  const room = editIndex !== null ? database.rooms[editIndex] : null;

  if (room) {
    DOM.roomName.value = room.name;
    DOM.capacity.value = room.capacity;
    DOM.price.value = room.price;
    DOM.promo.value = room.promo;
    DOM.roomDate.value = room.date;
    DOM.roomStartTime.value = room.startTime;
    DOM.roomEndTime.value = room.endTime;

    DOM.modalTitle.textContent = "Edit Room";
    if (DOM.submitBtn) {
      DOM.submitBtn.textContent = "Edit Room";
    }
  }

  DOM.roomForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const roomData = {
      id: room ? room.id : String(database.rooms.length + 1).padStart(2, "0"),
      name: DOM.roomName.value,
      capacity: parseInt(DOM.capacity.value),
      price: parseFloat(DOM.price.value),
      promo: DOM.promo.value,
      date: DOM.roomDate.value,
      startTime: DOM.roomStartTime.value,
      endTime: DOM.roomEndTime.value,
      status: room ? room.status : false,
    };

    if (room) {
      database.rooms[editIndex] = roomData;
      updateRooms();
      alert(`"${roomData.name}" has been successfully EDITED!`);
    } else {
      database.saveRoom(roomData);
      updateRooms();
      alert(`"${roomData.name}" has been successfully CREATED!`);
    }

    localStorage.removeItem("editRoomIndex");
    window.location.href = database.config.pages.staff;
  });
}

if (DOM.backBtn) {
  DOM.backBtn.addEventListener("click", () => {
    localStorage.removeItem("editRoomIndex");
    window.location.href = database.config.pages.staff;
  });
}

// ===================== STUDENT =====================
const updateBookings = () => {
  database.bookings = database.get(database.config.keys.bookings);
  renderStudentBookings();
  renderAvailableRooms();
  database.wallet.render();
};

function bookRoom(room, slot) {
  let currentBookings = database.get(database.config.keys.bookings);
  const studentId = sessionStorage.getItem("currentStudentId");
  const balance = database.wallet.get();

  const slotTaken = currentBookings.some(
    (b) => b.roomId === room.id && b.startTime === slot && b.date === room.date,
  );
  if (slotTaken)
    return alert("This slot has already been booked by another student!");

  if (balance < room.price)
    return alert("Not enough balance! Please deposit more money.");

  const booking = {
    id: Date.now(),
    roomId: room.id,
    room: room.name,
    date: room.date,
    startTime: slot,
    endTime: getEndTime(slot),
    price: room.price,
    studentId,
  };

  currentBookings.push(booking);
  database.set(database.config.keys.bookings, currentBookings);
  database.bookings = currentBookings;
  database.wallet.set(balance - room.price);

  alert(
    `Booking successful! $${room.price} has been deducted from your wallet.`,
  );
  updateBookings();
}

const renderAvailableRooms = () => {
  if (!DOM.availableRooms) return;

  const currentBookings = database.get(database.config.keys.bookings);
  database.bookings = currentBookings;
  const available = database.rooms.filter((r) => r.status);

  DOM.availableRooms.innerHTML = available.length
    ? available
        .map((r) => {
          const slots = generateSlots(r.startTime, r.endTime);
          return `
          <tr>
            <td>${r.name}</td>
            <td>${r.capacity}</td>
            <td>${r.price}</td>
            <td>${r.date}</td>
            <td>
              ${slots
                .map((s) => {
                  const isBooked = currentBookings.some(
                    (b) =>
                      b.roomId === r.id &&
                      b.startTime === s &&
                      b.date === r.date,
                  );
                  return `<button data-action="book" data-roomid="${r.id}" data-slot="${s}" ${isBooked ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ""}>${s} - ${getEndTime(s)}</button>`;
                })
                .join(" ")}
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="5">No rooms available</td></tr>`;
};

const renderStudentBookings = () => {
  if (!DOM.studentBookings) return;

  const studentId = sessionStorage.getItem("currentStudentId");
  const myBookings = database.bookings.filter((b) => b.studentId === studentId);

  DOM.studentBookings.innerHTML = myBookings.length
    ? myBookings
        .map(
          (b, i) => `
        <tr>
          <td>${b.room}</td>
          <td>${b.date}</td>
          <td>${b.startTime}</td>
          <td>${b.endTime}</td>
          <td>${b.price}</td>
          <td><button data-action="cancel" data-index="${i}">Cancel</button></td>
        </tr>`,
        )
        .join("")
    : `<tr><td colspan="6">No bookings yet</td></tr>`;
};

document.addEventListener("click", (e) => {
  const { action, roomid, slot, index } = e.target.dataset || {};

  if (action === "deposit") {
    const amount = Number(e.target.dataset.amount || 50);
    if ([10, 25, 50].includes(amount)) {
      database.wallet.deposit(amount);
    } else {
      alert("Invalid deposit amount.");
    }
  }

  if (action === "book") {
    const room = database.rooms.find((r) => r.id === roomid);
    if (room) bookRoom(room, slot);
  }

  if (action === "cancel") {
    let currentBookings = database.get(database.config.keys.bookings);
    const studentId = sessionStorage.getItem("currentStudentId");
    const myBookings = currentBookings.filter((b) => b.studentId === studentId);
    const cancelledBooking = myBookings[index];

    if (cancelledBooking) {
      const bookingIndex = currentBookings.findIndex(
        (b) => b.id === cancelledBooking.id,
      );
      if (bookingIndex !== -1) {
        currentBookings.splice(bookingIndex, 1);
        database.set(database.config.keys.bookings, currentBookings);
        database.bookings = currentBookings;
        database.wallet.set(database.wallet.get() + cancelledBooking.price);
        alert(
          `Booking cancelled! Refunded $${cancelledBooking.price} to your wallet`,
        );
        updateBookings();
      }
    }
  }
});

// ===================== INITIAL RENDER =====================
if (DOM.roomTable) renderRooms();
if (DOM.availableRooms) renderAvailableRooms();
if (DOM.studentBookings) renderStudentBookings();
if (DOM.walletBalance) database.wallet.render();
