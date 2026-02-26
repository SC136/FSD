const form = document.getElementById('contact-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const contactList = document.getElementById('contact-list');
const submitBtn = document.getElementById('submit-btn');
const editIndexInput = document.getElementById('edit-index');
const searchInput = document.getElementById('search-input');

let contacts = [];

function init() {
    const storedContacts = localStorage.getItem('contacts');

    if (storedContacts) {
        contacts = JSON.parse(storedContacts);
    }

    renderContacts();
}

function renderContacts(filterText = "") {
    contactList.innerHTML = '';

    const filteredContacts = contacts.filter(contact => {
        const text = filterText.toLowerCase();
        return contact.name.toLowerCase().includes(text) || contact.email.toLowerCase().includes(text);
    });

    filteredContacts.forEach((contact, index) => {
        const originalIndex = contacts.indexOf(contact);

        const li = document.createElement('li');
        li.className = 'contact-item';

        li.innerHTML = `
            <div class="contact-info">
                <strong>${contact.name}</strong>
                <span>📧 ${contact.email}</span> | <span>📞 ${contact.phone}</span>
            </div>
            <div class="contact-actions">
                <button class="edit-btn" onclick="editContact(${originalIndex})">Edit</button>
                <button class="delete-btn" onclick="deleteContact(${originalIndex})">Delete</button>
            </div>
        `;

        contactList.appendChild(li);
    });
}

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    if (name === "" || email === "" || phone === "") {
        alert("Please fill out all fields.");
        return;
    }

    const editIndex = parseInt(editIndexInput.value);

    const contactObj = {
        name: name,
        email: email,
        phone: phone
    };

    if (editIndex === -1) {
        contacts.push(contactObj);
    } else {
        contacts[editIndex] = contactObj;

        editIndexInput.value = "-1";
        submitBtn.textContent = 'Add Contact';
    }

    saveToLocalStorage();

    renderContacts(searchInput.value);

    form.reset();
});

function deleteContact(index) {
    if (confirm("Are you sure you want to delete this contact?")) {
        contacts.splice(index, 1);

        saveToLocalStorage();
        renderContacts(searchInput.value);
    }
}

function editContact(index) {
    const contact = contacts[index];

    nameInput.value = contact.name;
    emailInput.value = contact.email;
    phoneInput.value = contact.phone;

    editIndexInput.value = index;

    submitBtn.textContent = 'Update Contact';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveToLocalStorage() {
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

searchInput.addEventListener('input', function (e) {
    renderContacts(e.target.value);
});

init();
