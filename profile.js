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
        <nav class="profile-nav">
          <a href="./index.html" class="back-button">
            ← Back to Registry
          </a>
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

renderProfile();
