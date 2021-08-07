document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', sendMail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('.buttons').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'block';
  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('#display-emails').innerHTML = '';
  document.querySelector('#display-singleEmail').innerHTML = '';
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  // Fetch the emails in mailbox
  document.querySelector('#display-singleEmail').innerHTML = '';
  document.querySelector('#display-emails').innerHTML = '';
  mailBox(mailbox);
}

/**************************** Sendmail Function ****************************/
function sendMail() {
  fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => {
      return response.json()
    })
    .then(result => {
      const message = result;
      if (message.message === "Email sent successfully.") {
        alert(message.message);
        load_mailbox('sent');
      } else {
        document.querySelector('#message').innerHTML = message.error;
      }
    })
  event.preventDefault();
}

/**************************** Load different MailBox Function ****************************/
function mailBox(mailbox) {
  document.querySelector('.buttons').style.display = "none";
  fetch('/emails/' + mailbox)
    .then(response => response.json())
    .then(emails => {
      if (emails.length == 0) {
        document.querySelector('#display-emails').innerHTML = "No emails in " + mailbox;
      } else {
        console.log(emails.length);
        for (var i = 0; i < emails.length; i++) {
          // create a div for each email object //
          var newDiv = document.createElement("DIV");
          // set div id same with email id //
          newDiv.dataset.id = emails[i].id;
          const id = newDiv.dataset.id
          // add event listener to call display single email function //
          newDiv.addEventListener('click', (evt) => singleEmail(evt, mailbox, id));
          // add event listener to change read status //
          newDiv.addEventListener('click', (evt) => readStatus(evt, id));
          // set different class to email div base on read/unread status //
          var checkRead = emails[i].read;
          if (checkRead) {
            newDiv.classList.add("read");
          } else {
            newDiv.classList.add("unread");
          }
          // get correct values from each email object //
          var li = document.createElement('li');
          if (mailbox == "inbox" || mailbox == "archived") {
            li.innerHTML = `${emails[i].sender}`;
            li.setAttribute("class", "sender")
            newDiv.appendChild(li);
          } else if (mailbox == "sent") {
            li.innerHTML = `${emails[i].recipients}`;
            li.setAttribute("class", "recipients")
            newDiv.appendChild(li);
          }
          var li = document.createElement('li');
          li.innerHTML = `${emails[i].subject}`;
          li.setAttribute("class", "subject");
          newDiv.appendChild(li);
          var li = document.createElement('li');
          li.innerHTML = `${emails[i].timestamp}`;
          li.setAttribute("class", "timestamp")
          newDiv.appendChild(li);

          document.querySelector('#display-emails').append(newDiv);
        }
      }
    });
  event.preventDefault();
}


/**************************** Display Single Email Function ****************************/
function singleEmail(evt, mailbox, id) {
  //clear out other views//
  document.querySelector('#display-emails').innerHTML = '';
  // show current view //
  document.querySelector('#display-singleEmail').style.display = 'block';
  //check which button to show//
  if (evt) {
    getBtn(mailbox)
  };
  //display single email in web page//
  fetch('/emails/' + id)
    .then(response => response.json())
    .then(email => {
      const newDiv = document.createElement("DIV");
      for (key in email) {
        if (key == "sender" || key == "subject" || key == "body" || key == "timestamp") {
          var li = document.createElement('li');
          li.setAttribute("class", `${key}`)
          li.innerHTML = `${email[key]}`
          newDiv.appendChild(li)
        }
      }
      document.querySelector('#display-singleEmail').append(newDiv)
      // listen for reply button clicked to call reply function //
      replyBtn.addEventListener('click', (evt) => reply(evt, email));
    });

  // add event listener to modify archivestatus //
  archiveBtn.addEventListener('click', (evt) => archive(evt, id));
  unarchiveBtn.addEventListener('click', (evt) => archive(evt, id));
}


/**************************** Archive Function ****************************/
function archive(evt, id) {
  if (evt.target.id == "archiveBtn") {
    fetch('/emails/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
  } else if (evt.target.id == "unarchiveBtn") {
    fetch('/emails/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
  };
  //using reload here so as to not have to do a hard refresh to let the inbox load correctly//
  location.reload();
}


/**************************** Reply Function ****************************/
function reply(evt, email) {
  if (evt.target.id == "replyBtn") {
    // get compose form and prefill values //
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('.buttons').style.display = 'none';
    document.querySelector('#display-singleEmail').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    // check subjuct line //
    var subject = document.querySelector('#compose-subject')
    var subjectArray = subject.value.split(" ")
    if (subjectArray.includes("Re:")) {
      subject.value = `${email.subject}`;
    } else {
      subject.value = `Re: ${email.subject}`;
    }
  }
}

/**************************** Get Button Function ****************************/
function getBtn(mailbox) {
  document.querySelector('.buttons').style.display = 'block';
  //get  buttons//
  var archiveBtn = document.querySelector('#archiveBtn');
  var unarchiveBtn = document.querySelector('#unarchiveBtn');
  var replyBtn = document.querySelector('#replyBtn');
  if (mailbox == "inbox") {
    archiveBtn.style.display = 'block';
    replyBtn.style.display = 'block';
    unarchiveBtn.style.display = 'none'
  } else if (mailbox == "archive") {
    unarchiveBtn.style.display = 'block';
    archiveBtn.style.display = 'none';
    replyBtn.style.display = 'none';
  } else {
    document.querySelector('.buttons').style.display = 'none';
  }
};

/**************************** Change Read Status Function ****************************/
function readStatus(evt, id) {
  if (evt) {
    //change read status//
    fetch('/emails/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
  };
}