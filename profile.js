function esc(v = "") {
  return String(v).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function getAnimal() {
  const id = new URLSearchParams(location.search).get('id');
  return animals.find(a => a.id === id || a.animalId === id) || animals[0];
}

function detail(label, value) {
  return `
    <div class="detail">
      <span class="label">${esc(label)}</span>
      <span class="value">${esc(value || 'Not Added')}</span>
    </div>
  `;
}

function behaviourSection(a) {
  const traits = Array.isArray(a.traits) ? a.traits : [];

  const traitHTML = traits.length
    ? traits.map(trait => `
        <span class="trait-chip">${esc(trait)}</span>
      `).join('')
    : `<span class="trait-empty">No behaviour traits added</span>`;

  return `
    <section class="section">
      <div class="section-title">🧠 Behaviour & Temperament</div>

      <div class="behaviour-box">

        <div class="behaviour-main">
          <div>
            <span class="label">Overall Behaviour</span>
            <strong class="behaviour-value">
              ${esc(a.behaviour || 'Not Added')}
            </strong>
          </div>
        </div>

        <div class="traits-heading">
          Behaviour Traits
        </div>

        <div class="trait-list">
          ${traitHTML}
        </div>

      </div>
    </section>
  `;
}

function renderProfile() {
  const a = getAnimal();

  document.title = `${a.name} | Animal Digital ID`;

  const vaccineRows = a.vaccinations.length
    ? a.vaccinations.map((v, i) => `
        <tr class="${i === a.vaccinations.length - 1 ? 'latest' : ''}">
          <td>${esc(v[0])}</td>
          <td>${esc(v[1])}</td>
          <td>${esc(v[2])}</td>
          <td><span class="vaccine-status">${esc(v[3])}</span></td>
        </tr>
      `).join('')
    : `
        <tr>
          <td colspan="4" class="empty-row">
            Vaccination: Not Done
          </td>
        </tr>
      `;

  const map = a.mapUrl
    ? `
      <a class="button"
         href="${esc(a.mapUrl)}"
         target="_blank"
         rel="noopener">
        📍 View Location
      </a>
    `
    : `
      <span class="button disabled">
        📍 Location not added
      </span>
    `;

  const phone = a.phone
    ? `<a href="tel:${esc(a.phone)}">${esc(a.phone)}</a>`
    : '<span>Not Added</span>';

  const alternate = a.alternatePhone
    ? `<a href="tel:${esc(a.alternatePhone)}">${esc(a.alternatePhone)}</a>`
    : '<span>Not Added</span>';

  document.getElementById('app').innerHTML = `

  <div class="page">
    <div class="card">

      <header class="header">

        <div class="brand">
          <div class="logo">🐾</div>

          <div>
            <h1>ANIMAL DIGITAL ID</h1>
            <p>
              Digital identity record for a healthy & happy life
            </p>
          </div>
        </div>

        <!-- BACK TO REGISTRY -->
        <nav class="profile-actions">

<a href="./index.html" class="back-registry">
  ← Back to Registry
</a>

<button
  type="button"
  class="request-change-btn"
  onclick="openChangeRequest()">
  📝 Request a Change
</button>

</nav>

        <div class="id-panel">

          <div>
            <div class="id-label">
              Animal Identification Number
            </div>

            <div class="id-number">
              ${esc(a.animalId)}
            </div>
          </div>

          <div class="status">
            ✓ REGISTERED
          </div>

        </div>

      </header>


      <main class="content">

        <!-- PRIVATE RECORD NOTICE -->
        <div class="notice">
          <span>🛡️</span>

          <span>
            <strong>Private Animal Digital ID:</strong>
            This record is privately maintained by the owner
            and is not a government-issued identity document.
          </span>
        </div>


        <!-- PROFILE -->
        <section class="profile">

          <div class="photo-wrap">

            <div class="photo-frame">

              <img
                src="${esc(a.photo)}"
                alt="${esc(a.name)}'s photograph"
                class="photo"
              >

              <div class="registered">
                ✓ ${esc(a.status)}
              </div>

            </div>

            <div class="caption">
              Registered photograph • ${esc(a.name)}
            </div>

          </div>


          <div class="details">

            ${detail('Animal Name', a.name)}
            ${detail('Animal ID', a.animalId)}
            ${detail('Type', a.type)}
            ${detail('Breed', a.breed)}

            ${detail('Gender', a.gender)}
            ${detail('Date of Birth', a.dob)}
            ${detail('Pet Parent', a.parent)}
            ${detail('Behaviour', a.behaviour)}

            ${detail('Neutering Status', a.neutering)}
            ${detail('Record Status', a.status)}

          </div>

        </section>


        <!-- BEHAVIOUR -->
        ${behaviourSection(a)}


        <!-- VACCINATION -->
        <section class="section">

          <div class="section-title">
            💉 Vaccination Records
          </div>

          <div class="table-wrap">

            <table>

              <thead>
                <tr>
                  <th>Vaccine / Record</th>
                  <th>Date</th>
                  <th>Next Due</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                ${vaccineRows}
              </tbody>

            </table>

          </div>

        </section>


        <!-- LOCATION -->
        <section class="section">

          <div class="section-title">
            📍 Registered Location
          </div>

          <div class="location-box">

            <div>

              <div class="location-name">
                ${esc(a.location)}
              </div>

              <div class="location-sub">
                Registered location for ${esc(a.name)}
              </div>

            </div>

            ${map}

          </div>

        </section>


        <!-- OWNER -->
        <section class="section">

          <div class="section-title">
            📞 Pet Parent & Emergency Information
          </div>

          <div class="owner-grid">

            <div class="contact">
              <span class="label">Pet Parent</span>
              <strong>${esc(a.parent)}</strong>
            </div>

            <div class="contact">
              <span class="label">Phone</span>
              ${phone}
            </div>

            <div class="contact">
              <span class="label">Alternate Phone</span>
              ${alternate}
            </div>

            <div class="contact">
              <span class="label">Behaviour</span>
              <strong>${esc(a.behaviour)}</strong>
            </div>

          </div>

        </section>


        <!-- QR -->
        <section class="verification">

          <div>

            <div class="verify-title">
              🔎 Digital ID Verification
            </div>

            <div class="verify-text">
              Scan the QR code to open this animal's live profile.
            </div>

          </div>

          <div>

            <div id="qrcode" class="qrcode"></div>

            <div class="mini-id">
              ${esc(a.animalId)}
            </div>

          </div>

        </section>

      </main>


      <footer class="footer">

        <strong>ANIMAL DIGITAL ID</strong>
        • ${esc(a.animalId)}

        <br>

        Please contact the pet parent if
        ${esc(a.name)} is found.

        <br>

        Private owner-maintained record
        • Not a government-issued identity document

      </footer>

    </div>
  </div>
  `;


  <!-- QR CODE -->

  if (window.QRCode) {

    const url =
      `${location.origin}${location.pathname}?id=${encodeURIComponent(a.id)}`;

    new QRCode(
      document.getElementById('qrcode'),
      {
        text: url,
        width: 90,
        height: 90,
        correctLevel: QRCode.CorrectLevel.M
      }
    );

  }
}

function openChangeRequest() {

  const a = getAnimal();

  const existing = document.getElementById("changeRequest");

  if (existing) {
    existing.remove();
    return;
  }

  const modal = document.createElement("div");

  modal.id = "changeRequest";
  modal.className = "change-request";

  modal.innerHTML = `

    <div class="change-request-card">

      <div class="change-request-header">

        <div class="request-title-area">

          <div class="request-icon">
            📝
          </div>

          <div>
            <h3>Request a Change</h3>

            <p>
              ${esc(a.name)}
              <span>•</span>
              ${esc(a.animalId)}
            </p>
          </div>

        </div>

        <button
          type="button"
          class="close-request"
          aria-label="Close"
          onclick="document.getElementById('changeRequest').remove()">
          ×
        </button>

      </div>


      <div class="request-notice">
        <span>🔎</span>

        <div>
          <strong>Information review</strong>

          <p>
            Submitted changes are reviewed by the registry owner
            before the animal profile is updated.
          </p>
        </div>
      </div>

      <form
        id="animalChangeForm"
        class="change-form"
        action="https://formspree.io/f/xrpgegka"
        method="POST">


        <input
          type="hidden"
          name="_subject"
          value="Animal Registry Change Request">

        <input
          type="hidden"
          name="Animal Name"
          value="${esc(a.name)}">

        <input
          type="hidden"
          name="Animal ID"
          value="${esc(a.animalId)}">

        <input
          type="hidden"
          name="Request Source"
          value="Animal Digital ID Registry">


        <div class="form-group">

          <label for="requestedField">
            Information to change
          </label>

          <select
            id="requestedField"
            name="Requested Field"
            required>

            <option value="">
              Select a field
            </option>

            <option>Animal Name</option>
            <option>Breed</option>
            <option>Gender</option>
            <option>Date of Birth</option>
            <option>Pet Parent</option>
            <option>Phone</option>
            <option>Alternate Phone</option>
            <option>Location</option>
            <option>Behaviour</option>
            <option>Behaviour Traits</option>
            <option>Neutering Status</option>
            <option>Vaccination</option>
            <option>Photo</option>

          </select>

        </div>


        <div class="form-group">

          <label for="currentInformation">
            Current information
          </label>

          <input
            id="currentInformation"
            type="text"
            name="Current Information"
            placeholder="What is currently shown?"
            required>

        </div>


        <div class="form-group">

          <label for="requestedInformation">
            Requested information
          </label>

          <input
            id="requestedInformation"
            type="text"
            name="Requested Information"
            placeholder="What should it be changed to?"
            required>

        </div>


        <div class="form-group">

          <label for="reason">
            Reason / additional details
          </label>

          <textarea
            id="reason"
            name="Reason"
            rows="4"
            placeholder="Please explain the requested change..."
            required></textarea>

        </div>


        <div class="form-row">

          <div class="form-group">

            <label for="requesterName">
              Your name
            </label>

            <input
              id="requesterName"
              type="text"
              name="Requester Name"
              placeholder="Your name"
              required>

          </div>


          <div class="form-group">

            <label for="requesterContact">
              Your contact
            </label>

            <input
              id="requesterContact"
              type="text"
              name="Requester Contact"
              placeholder="Phone or email"
              required>

          </div>

        </div>


        <input
          type="hidden"
          name="_captcha"
          value="true">

        <input
          type="hidden"
          name="_template"
          value="table">

<div
  id="changeRequestSuccess"
  class="request-success"
  style="display:none;">
  
  <span class="success-icon">✓</span>

  <div>
    <strong>Request submitted successfully</strong>

    <p>
      Your change request has been received and will be
      reviewed by the registry owner.
    </p>
  </div>

</div>

        <div class="request-actions">

          <button
            type="button"
            class="cancel-request"
            onclick="document.getElementById('changeRequest').remove()">

            Cancel

          </button>


          <button
            type="submit"
            class="submit-change">

            ✓ Submit Request

          </button>

        </div>

      </form>

    </div>

  `;

  document.body.appendChild(modal);


  /* Close when clicking outside the card */

  modal.addEventListener("click", function(e) {

    if (e.target === modal) {
      modal.remove();
    }

  });


  /* Close with ESC */

  document.addEventListener("keydown", function escHandler(e) {

    if (e.key === "Escape") {

      const current = document.getElementById("changeRequest");

      if (current) {
        current.remove();
      }

      document.removeEventListener(
        "keydown",
        escHandler
      );

    }

  });

}

renderProfile();
