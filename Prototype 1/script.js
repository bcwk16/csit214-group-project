// ===================== DOM ELEMENTS =====================
const DOM = {
  // Login Page
  loginForm: document.getElementById("loginForm"),
  role: document.getElementById("role"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  errorDiv: document.getElementById("loginError"),

  // Staff Page
  roomTable: document.getElementById("roomTable"),
  promoTable: document.getElementById("promoTable"),

  // Room Form Page
  roomForm: document.getElementById("roomForm"),
  roomName: document.getElementById("roomName"),
  capacity: document.getElementById("capacity"),
  price: document.getElementById("price"),
  roomDate: document.getElementById("roomDate"),
  roomStartTime: document.getElementById("roomStartTime"),
  roomEndTime: document.getElementById("roomEndTime"),
  submitBtn: document.getElementById("submitBtn"),
  backBtn: document.getElementById("backBtn"),
  modalTitle: document.getElementById("modalTitle"),

  // Student Page
  walletBalance: document.getElementById("walletBalance"),
  studentBookings: document.getElementById("studentBookings"),
  roomsContainer: document.getElementById("roomsContainer"),

  // Deposit Page
  customDepositBtn: document.getElementById("customDepositBtn"),
  customAmount: document.getElementById("customAmount"),

  // Checkout Page
  confirmBookingBtn: document.getElementById("confirmBookingBtn"),
  cancelCheckoutBtn: document.getElementById("cancelCheckoutBtn"),
  applyPromoBtn: document.getElementById("applyPromoBtn"),
  promoCodeInput: document.getElementById("promoCodeInput"),
  promoMessage: document.getElementById("promoMessage"),
  summaryRoomName: document.getElementById("summaryRoomName"),
  summaryDate: document.getElementById("summaryDate"),
  summarySlot: document.getElementById("summarySlot"),
  summaryEndTime: document.getElementById("summaryEndTime"),
  summaryOriginalPrice: document.getElementById("summaryOriginalPrice"),
  displayOriginalPrice: document.getElementById("displayOriginalPrice"),
  finalPriceEl: document.getElementById("finalPrice"),
  discountPercent: document.getElementById("discountPercent"),
  discountAmount: document.getElementById("discountAmount"),
  discountRow: document.getElementById("discountRow"),
};

// ===================== LOGOUT FUNCTION =====================
const clearSessionAndLogout = () => {
  sessionStorage.clear();
  window.location.href = "index.html";
};

// =================== LocalStorage Database ===================
const database = {
  config: {
    keys: {
      users: "users",
      rooms: "rooms",
      bookings: "bookings",
      promoCodes: "promoCodes",
      notifications: "notifications",
    },
    pages: { staff: "staff.html", student: "student.html" },
  },
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
        date: "2026-04-20",
        startTime: "09:00",
        endTime: "12:00",
        status: true,
      },
      {
        id: "02",
        name: "UOW Seminar Room B",
        capacity: 15,
        price: 40,
        date: "2026-04-22",
        startTime: "13:00",
        endTime: "16:00",
        status: true,
      },
    ],
    bookings: [],
    promoCodes: [
      {
        code: "WELCOME10",
        discount: 10,
        validUntil: "2026-12-31",
        active: true,
      },
      {
        code: "SPRING20",
        discount: 20,
        validUntil: "2026-05-30",
        active: true,
      },
    ],
    notifications: [],
  },
  get: (k) => JSON.parse(localStorage.getItem(k)),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  init() {
    for (let [k, v] of Object.entries(this.defaults)) {
      if (!localStorage.getItem(this.config.keys[k]))
        this.set(this.config.keys[k], v);
      this[k] = this.get(this.config.keys[k]);
    }
  },
  saveRoom(room) {
    room.id = String(
      this.rooms.reduce((m, r) => Math.max(m, +r.id), 0) + 1,
    ).padStart(2, "0");
    this.rooms.push(room);
    this.set(this.config.keys.rooms, this.rooms);
  },
  wallet: {
    get: () => {
      const student = database.users.students.find(
        (s) => s.id === sessionStorage.getItem("currentStudentId"),
      );
      return student ? student.wallet : 0;
    },
    set: (val) => {
      const student = database.users.students.find(
        (s) => s.id === sessionStorage.getItem("currentStudentId"),
      );
      if (student) {
        student.wallet = Math.round(val * 100) / 100;
        database.set(database.config.keys.users, database.users);
        if (DOM.walletBalance) DOM.walletBalance.textContent = student.wallet;
        const depositBalance = document.getElementById("walletBalance");
        if (depositBalance) depositBalance.textContent = student.wallet;
      }
    },
    deposit: (amt) => {
      if (amt <= 0) return alert("Please enter a valid amount!");
      let newBalance = database.wallet.get() + amt;
      newBalance = Math.round(newBalance * 100) / 100;
      database.wallet.set(newBalance);
      alert(`Deposited $${amt}! New balance: $${newBalance}`);
      return true;
    },
  },
};
database.init();

// ===================== NOTIFICATION SYSTEM =====================
const addNotification = (
  studentId,
  message,
  roomName,
  date,
  time,
  refundAmount,
) => {
  const notifications = database.get(database.config.keys.notifications) || [];
  notifications.push({
    id: Date.now() + Math.random(),
    studentId: studentId,
    message: message,
    roomName: roomName,
    date: date,
    time: time,
    refundAmount: refundAmount,
    timestamp: Date.now(),
    read: false,
  });
  database.set(database.config.keys.notifications, notifications);
  console.log(`Notification added for student ${studentId}: ${roomName}`);
};

const getPendingNotifications = (studentId) => {
  const notifications = database.get(database.config.keys.notifications) || [];
  const pending = notifications.filter(
    (n) => n.studentId === studentId && !n.read,
  );
  console.log(`Pending notifications for ${studentId}:`, pending.length);
  return pending;
};

const markNotificationAsRead = (notificationId) => {
  const notifications = database.get(database.config.keys.notifications) || [];
  const updated = notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n,
  );
  database.set(database.config.keys.notifications, updated);
};

const clearNotificationsForStudent = (studentId) => {
  const notifications = database.get(database.config.keys.notifications) || [];
  const remaining = notifications.filter((n) => n.studentId !== studentId);
  database.set(database.config.keys.notifications, remaining);
};

const showStudentNotifications = () => {
  const currentStudentId = sessionStorage.getItem("currentStudentId");
  if (!currentStudentId) {
    console.log("No student logged in");
    return;
  }

  const pending = getPendingNotifications(currentStudentId);
  console.log(
    "Showing notifications for:",
    currentStudentId,
    "Count:",
    pending.length,
  );

  if (pending.length > 0) {
    let message = "BOOKING CANCELLATIONS\n\n";
    pending.forEach((notification) => {
      message += `  Room: ${notification.roomName}\n`;
      message += `  ${notification.message}\n`;
      message += `  Refund: $${notification.refundAmount.toFixed(2)}\n\n`;
      markNotificationAsRead(notification.id);
    });
    message += "The money has been refunded to your wallet.";
    alert(message);

    // Refresh the page data
    if (DOM.roomsContainer) renderAvailableRooms();
    if (DOM.studentBookings) renderStudentBookings();
    if (DOM.walletBalance)
      DOM.walletBalance.textContent = database.wallet.get();
  }
};

// ===================== REAL-TIME SYNC =====================
window.addEventListener("storage", (e) => {
  if (e.key === "rooms") {
    database.rooms = database.get(database.config.keys.rooms);
    if (DOM.roomTable) renderRooms();
    if (DOM.roomsContainer) renderAvailableRooms();
  }
  if (e.key === "bookings") {
    database.bookings = database.get(database.config.keys.bookings);
    if (DOM.studentBookings) renderStudentBookings();
    if (DOM.roomsContainer) renderAvailableRooms();
  }
  if (e.key === "users") {
    database.users = database.get(database.config.keys.users);
    if (DOM.walletBalance)
      DOM.walletBalance.textContent = database.wallet.get();
    if (DOM.studentBookings) renderStudentBookings();
  }
  if (e.key === "promoCodes") {
    database.promoCodes = database.get(database.config.keys.promoCodes);
    if (DOM.promoTable) renderPromoCodes();
  }
  if (e.key === "notifications") {
    if (DOM.roomsContainer) showStudentNotifications();
  }
});

// ===================== UTILS =====================
const getEndTime = (startTime) => {
  let [hour, minute] = startTime.split(":").map(Number);
  let total = hour * 60 + minute + 60;
  let newHour = Math.floor(total / 60) % 24;
  let newMinute = total % 60;
  return `${String(newHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`;
};

const generateSlots = (start, end) => {
  let [startHour, startMin] = start.split(":").map(Number);
  let [endHour, endMin] = end.split(":").map(Number);
  let slots = [];
  let current = startHour * 60 + startMin;
  let endTotal = endHour * 60 + endMin;

  if (endTotal <= current) {
    endTotal += 24 * 60;
  }

  while (current + 60 <= endTotal) {
    let hour = Math.floor(current / 60) % 24;
    let minute = current % 60;
    slots.push(
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
    current += 60;
  }
  return slots;
};

// ===================== LOGIN PAGE =====================
if (DOM.loginForm) {
  DOM.loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const errorDiv = DOM.errorDiv;
    const role = DOM.role.value;
    const username = DOM.username.value.trim();
    const password = DOM.password.value.trim();

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
      sessionStorage.setItem("currentUsername", username);

      if (role === "student") {
        sessionStorage.setItem("currentStudentId", account.id);
      }
      window.location.href = database.config.pages[role];
    } else {
      if (errorDiv) {
        errorDiv.innerHTML = "Invalid Credentials!";
        errorDiv.style.display = "block";
      }
    }
  });
}
// ===================== STAFF PAGE =====================
const renderRooms = () => {
  if (!DOM.roomTable) return;
  DOM.roomTable.innerHTML = database.rooms
    .map(
      (r, i) => `
    <tr>
      <td>${r.name}</td>
      <td>${r.capacity}</td>
      <td>$${r.price}</td>
      <td>${r.date}</td>
      <td>${r.startTime}</td>
      <td>${r.endTime}</td>
      <td>${r.status ? "Available" : "Unavailable"}</td>
      <td class="action-buttons">
        <button data-action="toggle" data-index="${i}">${r.status ? "Unlaunch" : "Launch"}</button>
        <button data-action="edit" data-index="${i}">Edit</button>
        <button data-action="delete" data-index="${i}">Delete</button>
      </td>
    </tr>
  `,
    )
    .join("");

  const staffNameSpan = document.getElementById("staffName");
  if (staffNameSpan) {
    const username = sessionStorage.getItem("currentUsername");
    staffNameSpan.textContent = username || "Staff";
  }
};

const renderPromoCodes = () => {
  if (!DOM.promoTable) return;
  DOM.promoTable.innerHTML = database.promoCodes
    .map(
      (p, i) => `
    <tr>
      <td>${p.code}</td>
      <td>${p.discount}%</td>
      <td>${p.validUntil}</td>
      <td>${p.active ? "Active" : "Inactive"}</td>
      <td class="action-buttons">
        <button data-promo-action="toggle" data-promo-index="${i}">${p.active ? "Unlaunch" : "Launch"}</button>
        <button data-promo-action="edit" data-promo-index="${i}">Edit</button>
        <button data-promo-action="delete" data-promo-index="${i}">Delete</button>
      </td>
    </tr>
  `,
    )
    .join("");
};

const refundBookingsAndNotify = (roomId, roomName, actionType) => {
  let bookings = database.get(database.config.keys.bookings) || [];
  let affectedBookings = bookings.filter((b) => b.roomId === roomId);

  if (affectedBookings.length === 0) return false;

  affectedBookings.forEach((booking) => {
    let student = database.users.students.find(
      (s) => s.id === booking.studentId,
    );
    let refundAmount = booking.finalPrice || booking.originalPrice;

    if (student) {
      student.wallet += refundAmount;
    }

    addNotification(
      booking.studentId,
      `Your booking on ${booking.date} at ${booking.startTime} has been cancelled by staff.`,
      roomName,
      booking.date,
      booking.startTime,
      refundAmount,
    );
  });

  database.set(database.config.keys.users, database.users);

  let remainingBookings = bookings.filter((b) => b.roomId !== roomId);
  database.set(database.config.keys.bookings, remainingBookings);
  database.bookings = remainingBookings;

  alert(
    `Room "${roomName}" has been ${actionType}!\n\n` +
      `${affectedBookings.length} booking(s) cancelled.\n` +
      `All students have been refunded.\n` +
      `Notifications have been saved and will be shown when students log in.`,
  );

  return true;
};

// Staff Event Listeners
document.addEventListener("click", (e) => {
  let { action, index, promoAction, promoIndex } = e.target.dataset;

  if (index !== undefined) {
    if (action === "toggle") {
      let room = database.rooms[index];
      let hasBookings = (database.bookings || []).some(
        (b) => b.roomId === room.id,
      );

      if (!room.status) {
        if (
          confirm(
            `Are you sure you want to LAUNCH "${room.name}"?\n\nThis room will be available for booking.`,
          )
        ) {
          room.status = true;
          database.set(database.config.keys.rooms, database.rooms);
          renderRooms();
          alert(`Room "${room.name}" has been LAUNCHED!`);
        }
      } else {
        if (hasBookings) {
          if (
            confirm(
              `UNLAUNCH CONFIRMATION\n\nRoom: "${room.name}"\n\nThis room has ACTIVE BOOKINGS!\n\n• All bookings will be CANCELLED\n• Students will be FULLY REFUNDED\n• Notifications will be sent to students\n\nDo you want to continue?`,
            )
          ) {
            room.status = false;
            refundBookingsAndNotify(room.id, room.name, "UNLAUNCHED");
            database.set(database.config.keys.rooms, database.rooms);
            renderRooms();
            if (DOM.roomsContainer) renderAvailableRooms();
            if (DOM.studentBookings) renderStudentBookings();
          }
        } else {
          if (
            confirm(
              `UNLAUNCH CONFIRMATION\n\nRoom: "${room.name}"\n\nThis room has ACTIVE BOOKINGS!\n\n• All bookings will be CANCELLED\n• Students will be FULLY REFUNDED\n• Notifications will be sent to students\n\nDo you want to continue?`,
            )
          ) {
            room.status = false;
            database.set(database.config.keys.rooms, database.rooms);
            renderRooms();
            alert(`Room "${room.name}" has been UNLAUNCHED!`);
          }
        }
      }
    } else if (action === "edit") {
      localStorage.setItem("editRoomIndex", index);
      window.location.href = "room-form.html";
    } else if (action === "delete") {
      let room = database.rooms[index];
      let hasBookings = (database.bookings || []).some(
        (b) => b.roomId === room.id,
      );

      if (hasBookings) {
        if (
          confirm(
            `⚠️ UNLAUNCH CONFIRMATION ⚠️\n\nRoom: "${room.name}"\n\nThis room has ACTIVE BOOKINGS!\n\n• All bookings will be CANCELLED\n• Students will be FULLY REFUNDED\n• Notifications will be sent to students\n\nDo you want to continue?`,
          )
        ) {
          refundBookingsAndNotify(room.id, room.name, "DELETED");
          database.rooms.splice(index, 1);
          database.set(database.config.keys.rooms, database.rooms);
          renderRooms();
          if (DOM.roomsContainer) renderAvailableRooms();
          if (DOM.studentBookings) renderStudentBookings();
        }
      } else {
        if (
          confirm(
            `Are you sure you want to DELETE "${room.name}"?\n\nThis action cannot be undone.`,
          )
        ) {
          database.rooms.splice(index, 1);
          database.set(database.config.keys.rooms, database.rooms);
          renderRooms();
          alert(`Room "${room.name}" has been DELETED!`);
        }
      }
    }
  }

  if (promoAction === "toggle" && promoIndex !== undefined) {
    let promo = database.promoCodes[promoIndex];
    let newStatus = !promo.active;
    let actionText = newStatus ? "LAUNCHED" : "UNLAUNCHED";

    if (
      confirm(
        `Are you sure you want to ${actionText} promo code "${promo.code}"?`,
      )
    ) {
      database.promoCodes[promoIndex].active = newStatus;
      database.set(database.config.keys.promoCodes, database.promoCodes);
      renderPromoCodes();
      alert(`Promo code "${promo.code}" has been ${actionText}!`);
    }
  } else if (promoAction === "edit" && promoIndex !== undefined) {
    localStorage.setItem("editPromoIndex", promoIndex);
    window.location.href = "promo-form.html";
  } else if (promoAction === "delete" && promoIndex !== undefined) {
    let promo = database.promoCodes[promoIndex];
    if (
      confirm(
        `Are you sure you want to DELETE promo code "${promo.code}"?\n\nThis action cannot be undone.`,
      )
    ) {
      database.promoCodes.splice(promoIndex, 1);
      database.set(database.config.keys.promoCodes, database.promoCodes);
      renderPromoCodes();
      alert(`Promo code "${promo.code}" has been DELETED!`);
    }
  }

  // Logout button handler
  if (e.target.id === "logoutBtn" || e.target.closest("#logoutBtn")) {
    e.preventDefault();
    if (confirm("Are you sure you want to logout?")) {
      clearSessionAndLogout();
    }
  }
});

// ===================== ROOM FORM PAGE =====================
if (DOM.roomForm) {
  let editIndex = localStorage.getItem("editRoomIndex");
  let room = editIndex !== null ? database.rooms[parseInt(editIndex)] : null;

  if (room) {
    DOM.roomName.value = room.name;
    DOM.capacity.value = room.capacity;
    DOM.price.value = room.price;
    DOM.roomDate.value = room.date;
    DOM.roomStartTime.value = room.startTime;
    DOM.roomEndTime.value = room.endTime;
    DOM.modalTitle.textContent = "Edit Room";
    if (DOM.submitBtn) DOM.submitBtn.textContent = "Update Room";
  }

  DOM.roomForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let roomData = {
      id: room ? room.id : null,
      name: DOM.roomName.value,
      capacity: parseInt(DOM.capacity.value),
      price: parseFloat(DOM.price.value),
      date: DOM.roomDate.value,
      startTime: DOM.roomStartTime.value,
      endTime: DOM.roomEndTime.value,
      status: room ? room.status : true,
    };
    if (room) database.rooms[editIndex] = roomData;
    else database.saveRoom(roomData);
    database.set(database.config.keys.rooms, database.rooms);
    alert(`"${roomData.name}" ${room ? "updated" : "created"}!`);
    localStorage.removeItem("editRoomIndex");
    window.location.href = "staff.html";
  });

  if (DOM.backBtn) {
    DOM.backBtn.addEventListener("click", () => {
      localStorage.removeItem("editRoomIndex");
      window.location.href = "staff.html";
    });
  }
}

// ===================== PROMO FORM PAGE =====================
if (document.getElementById("promoForm")) {
  const promoForm = document.getElementById("promoForm");
  const promoCodeInput = document.getElementById("promoCode");
  const discountInput = document.getElementById("discount");
  const validUntilInput = document.getElementById("validUntil");
  const promoSubmitBtn = document.getElementById("submitBtn");
  const promoModalTitle = document.getElementById("modalTitle");
  const promoBackBtn = document.getElementById("backBtn");

  let editIdx = localStorage.getItem("editPromoIndex");
  let promo = editIdx !== null ? database.promoCodes[parseInt(editIdx)] : null;

  if (promo) {
    promoCodeInput.value = promo.code;
    discountInput.value = promo.discount;
    validUntilInput.value = promo.validUntil;
    promoModalTitle.textContent = "Edit Promo Code";
    promoSubmitBtn.textContent = "Update Promo";
  }

  promoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let data = {
      code: promoCodeInput.value.toUpperCase(),
      discount: parseInt(discountInput.value),
      validUntil: validUntilInput.value,
      active: true,
    };
    if (promo) database.promoCodes[editIdx] = data;
    else {
      if (database.promoCodes.some((p) => p.code === data.code))
        return alert("Code exists!");
      database.promoCodes.push(data);
    }
    database.set(database.config.keys.promoCodes, database.promoCodes);
    alert(`"${data.code}" ${promo ? "updated" : "created"}!`);
    localStorage.removeItem("editPromoIndex");
    window.location.href = "staff.html";
  });

  if (promoBackBtn) {
    promoBackBtn.addEventListener("click", () => {
      localStorage.removeItem("editPromoIndex");
      window.location.href = "staff.html";
    });
  }
}

// ===================== STUDENT PAGE =====================
const goToCheckout = (room, slot, endTime) => {
  sessionStorage.setItem(
    "checkoutData",
    JSON.stringify({
      roomId: room.id,
      roomName: room.name,
      date: room.date,
      slot,
      endTime,
      originalPrice: room.price,
    }),
  );
  window.location.href = "checkout.html";
};

const renderAvailableRooms = () => {
  if (!DOM.roomsContainer) return;

  database.rooms = database.get(database.config.keys.rooms);
  let bookings = database.get(database.config.keys.bookings) || [];
  let available = database.rooms.filter((r) => r.status);

  if (!available.length) {
    DOM.roomsContainer.innerHTML =
      '<div class="room-card">No rooms available</div>';
    return;
  }

  DOM.roomsContainer.innerHTML = available
    .map((room) => {
      let slots = generateSlots(room.startTime, room.endTime);
      return `
      <div class="room-card">
        <div class="room-header">
          <div class="room-title"><h3>${room.name}</h3><div class="room-meta"><span>${room.capacity} pax</span><span>${room.date}</span></div></div>
          <div class="room-price-box"><div class="price">$${room.price}</div><div class="price-label">per hour</div></div>
        </div>
        <div class="slots-section">
          <div class="slots-title">Available Time Slots</div>
          <div class="slots-grid">
            ${slots
              .map((slot) => {
                let endTime = getEndTime(slot);
                let isBooked = bookings.some(
                  (b) =>
                    b.roomId === room.id &&
                    b.startTime === slot &&
                    b.date === room.date,
                );
                return `<button class="slot-btn ${isBooked ? "booked" : ""}" data-roomid="${room.id}" data-slot="${slot}" data-endtime="${endTime}" ${isBooked ? "disabled" : ""}>${slot} - ${endTime}</button>`;
              })
              .join("")}
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  document.querySelectorAll(".slot-btn:not(.booked)").forEach((btn) => {
    btn.removeEventListener("click", handleSlotClick);
    btn.addEventListener("click", handleSlotClick);
  });

  const studentNameSpan = document.getElementById("studentName");
  if (studentNameSpan) {
    const username = sessionStorage.getItem("currentUsername");
    studentNameSpan.textContent = username || "Student";
  }

  window.addEventListener("DOMContentLoaded", () => {
    showStudentNotifications();
  });
};

const handleSlotClick = (e) => {
  let btn = e.currentTarget;
  let room = database.rooms.find((r) => r.id === btn.dataset.roomid);
  if (room) goToCheckout(room, btn.dataset.slot, btn.dataset.endtime);
};

const renderStudentBookings = () => {
  if (!DOM.studentBookings) return;

  database.bookings = database.get(database.config.keys.bookings);
  let studentId = sessionStorage.getItem("currentStudentId");
  let myBookings = (database.bookings || []).filter(
    (b) => b.studentId === studentId,
  );

  DOM.studentBookings.innerHTML = myBookings.length
    ? myBookings
        .map(
          (b, i) => `
    <tr>
      <td>${b.room}</td>
      <td>${b.date}</td>
      <td>${b.startTime}</td>
      <td>${b.endTime}</td>
      <td>$${b.originalPrice}</td>
      <td>${b.discountPercent > 0 ? `${b.discountPercent}%` : "None"}</td>
      <td>$${(b.finalPrice || b.originalPrice).toFixed(2)}</td>
      <td><button data-cancel="${i}">Cancel</button></td>
    </tr>
  `,
        )
        .join("")
    : '</table><td colspan="8">No bookings yet</td><tr';

  document.querySelectorAll("[data-cancel]").forEach((btn) => {
    btn.removeEventListener("click", handleCancelClick);
    btn.addEventListener("click", handleCancelClick);
  });
};

const handleCancelClick = (e) => {
  let idx = parseInt(e.currentTarget.dataset.cancel);
  let studentId = sessionStorage.getItem("currentStudentId");
  let allBookings = database.get(database.config.keys.bookings) || [];
  let booking = allBookings.filter((b) => b.studentId === studentId)[idx];

  if (
    booking &&
    confirm(
      `Cancel booking for "${booking.room}" on ${booking.date} at ${booking.startTime}?\n\nYou will be refunded $${(booking.finalPrice || booking.originalPrice).toFixed(2)}`,
    )
  ) {
    let refund = booking.finalPrice || booking.originalPrice;
    database.set(
      database.config.keys.bookings,
      allBookings.filter((b) => b.id !== booking.id),
    );
    database.bookings = database.get(database.config.keys.bookings);
    database.wallet.set(database.wallet.get() + refund);
    alert(`Booking cancelled! Refunded $${refund.toFixed(2)} to your wallet.`);
    renderAvailableRooms();
    renderStudentBookings();
  }
};

// ===================== DEPOSIT PAGE =====================
if (DOM.customDepositBtn) {
  const updateBalance = () => {
    if (DOM.walletBalance)
      DOM.walletBalance.textContent = database.wallet.get();
  };
  updateBalance();

  DOM.customDepositBtn.addEventListener("click", () => {
    let amount = parseInt(DOM.customAmount.value);
    if (isNaN(amount) || amount <= 0)
      return alert("Please enter a valid positive amount!");
    database.wallet.deposit(amount);
    updateBalance();
    DOM.customAmount.value = "";
  });
}

// ===================== CHECKOUT PAGE =====================
if (DOM.confirmBookingBtn) {
  const loadCheckoutPage = () => {
    let data = sessionStorage.getItem("checkoutData");
    if (!data) {
      alert("No booking selected.");
      window.location.href = "student.html";
      return;
    }
    let booking = JSON.parse(data);

    if (DOM.summaryRoomName) DOM.summaryRoomName.textContent = booking.roomName;
    if (DOM.summaryDate) DOM.summaryDate.textContent = booking.date;
    if (DOM.summarySlot) DOM.summarySlot.textContent = booking.slot;
    if (DOM.summaryEndTime) DOM.summaryEndTime.textContent = booking.endTime;
    if (DOM.summaryOriginalPrice)
      DOM.summaryOriginalPrice.textContent = booking.originalPrice;
    if (DOM.displayOriginalPrice)
      DOM.displayOriginalPrice.textContent = booking.originalPrice;
    if (DOM.finalPriceEl) DOM.finalPriceEl.textContent = booking.originalPrice;

    let appliedDiscount = 0,
      finalPrice = booking.originalPrice;

    if (DOM.applyPromoBtn) {
      DOM.applyPromoBtn.removeEventListener("click", handleApplyPromo);
      DOM.applyPromoBtn.addEventListener("click", handleApplyPromo);
    }

    function handleApplyPromo() {
      let code = DOM.promoCodeInput.value.toUpperCase();
      let promo = database.promoCodes.find(
        (p) =>
          p.code === code &&
          p.active &&
          p.validUntil >= new Date().toISOString().split("T")[0],
      );
      if (promo) {
        appliedDiscount = promo.discount;
        finalPrice =
          Math.round(
            booking.originalPrice * (1 - appliedDiscount / 100) * 100,
          ) / 100;
        if (DOM.discountPercent)
          DOM.discountPercent.textContent = appliedDiscount;
        if (DOM.discountAmount)
          DOM.discountAmount.textContent = (
            booking.originalPrice - finalPrice
          ).toFixed(2);
        if (DOM.finalPriceEl)
          DOM.finalPriceEl.textContent = finalPrice.toFixed(2);
        if (DOM.discountRow) DOM.discountRow.style.display = "block";
        if (DOM.promoMessage)
          DOM.promoMessage.innerHTML = `<span class="success">${promo.code} applied! You save $${(booking.originalPrice - finalPrice).toFixed(2)}!</span>`;
      } else {
        if (DOM.promoMessage)
          DOM.promoMessage.innerHTML = `<span class="error">Invalid or expired promo code.</span>`;
      }
    }

    if (DOM.confirmBookingBtn) {
      DOM.confirmBookingBtn.removeEventListener("click", handleConfirmBooking);
      DOM.confirmBookingBtn.addEventListener("click", handleConfirmBooking);
    }

    function handleConfirmBooking() {
      let bookings = database.get(database.config.keys.bookings);
      let studentId = sessionStorage.getItem("currentStudentId");
      let balance = database.wallet.get();
      finalPrice = Math.round(finalPrice * 100) / 100;

      if (
        bookings.some(
          (b) =>
            b.roomId === booking.roomId &&
            b.startTime === booking.slot &&
            b.date === booking.date,
        )
      ) {
        alert("Slot already booked!");
        sessionStorage.removeItem("checkoutData");
        window.location.href = "student.html";
        return;
      }
      if (balance < finalPrice) {
        alert(`Need $${finalPrice.toFixed(2)}, have $${balance.toFixed(2)}`);
        return;
      }

      bookings.push({
        id: Date.now(),
        roomId: booking.roomId,
        room: booking.roomName,
        date: booking.date,
        startTime: booking.slot,
        endTime: booking.endTime,
        originalPrice: booking.originalPrice,
        finalPrice,
        discountPercent: appliedDiscount,
        promoCodeUsed:
          appliedDiscount > 0 ? DOM.promoCodeInput.value.toUpperCase() : null,
        studentId,
      });
      database.set(database.config.keys.bookings, bookings);
      database.wallet.set(balance - finalPrice);
      alert(
        `Booked! Paid $${finalPrice.toFixed(2)}${appliedDiscount > 0 ? ` Saved $${(booking.originalPrice - finalPrice).toFixed(2)}` : ""}`,
      );
      sessionStorage.removeItem("checkoutData");
      window.location.href = "student.html";
    }

    if (DOM.cancelCheckoutBtn) {
      DOM.cancelCheckoutBtn.removeEventListener("click", handleCancelCheckout);
      DOM.cancelCheckoutBtn.addEventListener("click", handleCancelCheckout);
    }

    function handleCancelCheckout() {
      sessionStorage.removeItem("checkoutData");
      window.location.href = "student.html";
    }
  };
  loadCheckoutPage();
}

// ===================== INITIAL RENDER =====================
if (DOM.roomTable) renderRooms();
if (DOM.promoTable) renderPromoCodes();
if (DOM.roomsContainer) {
  renderAvailableRooms();
}
if (DOM.studentBookings) renderStudentBookings();
if (DOM.walletBalance) DOM.walletBalance.textContent = database.wallet.get();
if (DOM.roomsContainer) {
  showStudentNotifications();
}
