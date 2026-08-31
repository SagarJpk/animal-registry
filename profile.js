// =========================================================
// ANIMAL DIGITAL ID - PROFILE.JS
// =========================================================


// =========================================================
// HTML ESCAPE
// =========================================================

function esc(v = "") {
  return String(v).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}


// =========================================================
// GET CURRENT ANIMAL
// =========================================================

function getAnimal() {

  const id =
    new URLSearchParams(location.search).get('id');

  return (
    animals.find(
      a => a.id === id || a.animalId === id
    )
    || animals[0]
  );

}


// =========================================================
// DETAIL FIELD
// =========================================================

function detail(label, value) {

  return `
    <div class="detail">
      <span class="label">
        ${esc(label)}
      </span>

      <span class="value">
        ${esc(value || 'Not Added')}
      </span>
    </div>
  `;

}


// =========================================================
// GET BEHAVIOUR TRAITS
// Supports both:
// traits
// behaviourTraits
// =========================================================

function getBehaviourTraits(a) {

  if (Array.isArray(a.behaviourTraits)) {
    return a.behaviourTraits;
  }

  if (Array.isArray(a.traits)) {
    return a.traits;
  }

  return [];

}


// =========================================================
// BEHAVIOUR SUMMARY
// =========================================================

function behaviourSummary(a) {

  const traits = getBehaviourTraits(a);

  const previewTraits =
    traits.slice(0, 4);


  const traitHTML =
    previewTraits.length

      ? previewTraits.map(trait => `
          <span class="trait-chip">
            ${esc(trait)}
          </span>
        `).join('')

      : `
          <span class="trait-empty">
            No behaviour traits added
          </span>
        `;


  const moreCount =
    traits.length > 4

      ? `
          <span class="trait-more">
            +${traits.length - 4} more
          </span>
        `

      : '';


  return `

    <section class="section">

      <div class="section-title">
        🧠 Behaviour & Temperament
      </div>


      <div class="behaviour-summary">

        <div class="behaviour-summary-main">

          <div>

            <span class="label">
              Overall Behaviour
            </span>

            <strong class="behaviour-value">
              ${esc(
                a.behaviour || 'Not Added'
              )}
            </strong>

          </div>


          <button
            type="button"
            class="details-button"
            onclick="openBehaviourDetails()">

            View Details

          </button>

        </div>


        <div class="traits-heading">
          Behaviour Traits
        </div>


        <div class="trait-list">

          ${traitHTML}

          ${moreCount}

        </div>

      </div>

    </section>

  `;

}


// =========================================================
// VACCINATION SUMMARY
// =========================================================

function vaccinationSummary(a) {

  const vaccinations =
    Array.isArray(a.vaccinations)
      ? a.vaccinations
      : [];


  const latest =
    vaccinations.length
      ? vaccinations[vaccinations.length - 1]
      : null;


  return `

    <section class="section">

      <div class="section-title">
        💉 Vaccination Records
      </div>


      <div class="vaccination-summary">

        <div class="vaccination-summary-info">


          <div class="summary-stat">

            <span class="label">
              Total Records
            </span>

            <strong>
              ${vaccinations.length}
            </strong>

          </div>


          <div class="summary-stat">

            <span class="label">
              Latest Vaccine
            </span>

            <strong>
              ${
                latest
                  ? esc(latest[0])
                  : 'Not Done'
              }
            </strong>

          </div>


          <div class="summary-stat">

            <span class="label">
              Next Due
            </span>

            <strong>

              ${
                latest && latest[2]
                  ? esc(latest[2])
                  : 'Not Added'
              }

            </strong>

          </div>


        </div>


        <button
          type="button"
          class="details-button"
          onclick="openVaccinationDetails()">

          View Full History

        </button>


      </div>

    </section>

  `;

}


// =========================================================
// RENDER PROFILE
// =========================================================

function renderProfile() {

  const a = getAnimal();


  document.title =
    `${a.name} | Animal Digital ID`;


  // =======================================================
  // LOCATION BUTTON
  // =======================================================

  const map = a.mapUrl

    ? `
        <a
          class="button"
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


  // =======================================================
  // PHONE
  // =======================================================

  const phone = a.phone

    ? `
        <a href="tel:${esc(a.phone)}">
          ${esc(a.phone)}
        </a>
      `

    : `
        <span>
          Not Added
        </span>
      `;


  // =======================================================
  // ALTERNATE PHONE
  // =======================================================

  const alternate = a.alternatePhone

    ? `
        <a href="tel:${esc(a.alternatePhone)}">
          ${esc(a.alternatePhone)}
        </a>
      `

    : `
        <span>
          Not Added
        </span>
      `;


  // =======================================================
  // MAIN PROFILE HTML
  // =======================================================

  document.getElementById('app').innerHTML = `

    <div class="page">

      <div class="card">


        <!-- =================================================
             HEADER
        ================================================== -->

        <header class="header">


          <div class="brand">

            <div class="logo">
              🐾
            </div>


            <div>

              <h1>
                ANIMAL DIGITAL ID
              </h1>

              <p>
                Digital identity record for a healthy & happy life
              </p>

            </div>

          </div>


          <!-- =================================================
               PROFILE ACTIONS
          ================================================== -->

          <nav class="profile-actions">


            <a
              href="./index.html"
              class="back-registry">

              ← Back to Registry

            </a>


            <button
              type="button"
              class="request-change-btn"
              onclick="openChangeRequest()">

              📝 Request a Change

            </button>


          </nav>


          <!-- =================================================
               ID PANEL
          ================================================== -->

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


        <!-- =================================================
             MAIN CONTENT
        ================================================== -->

        <main class="content">


          <!-- =================================================
               PRIVATE NOTICE
          ================================================== -->

          <div class="notice">

            <span>
              🛡️
            </span>


            <span>

              <strong>
                Private Animal Digital ID:
              </strong>

              This record is privately maintained by the owner
              and is not a government-issued identity document.

            </span>

          </div>


          <!-- =================================================
               PROFILE
          ================================================== -->

          <section class="profile">


            <div class="photo-wrap">


              <div class="photo-frame">


                <img
                  src="${esc(a.photo)}"
                  alt="${esc(a.name)}'s photograph"
                  class="photo">


                <div class="registered">

                  ✓ ${esc(a.status)}

                </div>


              </div>


              <div class="caption">

                Registered photograph •
                ${esc(a.name)}

              </div>


            </div>


            <!-- =================================================
                 DETAILS
            ================================================== -->

            <div class="details">


              ${detail(
                'Animal Name',
                a.name
              )}


              ${detail(
                'Animal ID',
                a.animalId
              )}


              ${detail(
                'Type',
                a.type
              )}


              ${detail(
                'Breed',
                a.breed
              )}


              ${detail(
                'Gender',
                a.gender
              )}


              ${detail(
                'Date of Birth',
                a.dob
              )}


              ${detail(
                'Pet Parent',
                a.parent
              )}


              ${detail(
                'Behaviour',
                a.behaviour
              )}


              ${detail(
                'Neutering Status',
                a.neutering
              )}


              ${detail(
                'Record Status',
                a.status
              )}


            </div>


          </section>


          <!-- =================================================
               BEHAVIOUR SUMMARY
          ================================================== -->

          ${behaviourSummary(a)}


          <!-- =================================================
               VACCINATION SUMMARY
          ================================================== -->

          ${vaccinationSummary(a)}


          <!-- =================================================
               LOCATION
          ================================================== -->

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

                  Registered location for
                  ${esc(a.name)}

                </div>

              </div>


              ${map}


            </div>


          </section>


          <!-- =================================================
               OWNER INFORMATION
          ================================================== -->

          <section class="section">


            <div class="section-title">

              📞 Pet Parent & Emergency Information

            </div>


            <div class="owner-grid">


              <div class="contact">

                <span class="label">
                  Pet Parent
                </span>

                <strong>
                  ${esc(a.parent)}
                </strong>

              </div>


              <div class="contact">

                <span class="label">
                  Phone
                </span>

                ${phone}

              </div>


              <div class="contact">

                <span class="label">
                  Alternate Phone
                </span>

                ${alternate}

              </div>


              <div class="contact">

                <span class="label">
                  Behaviour
                </span>

                <strong>
                  ${esc(a.behaviour)}
                </strong>

              </div>


            </div>


          </section>


          <!-- =================================================
               QR VERIFICATION
          ================================================== -->

          <section class="verification">


            <div>

              <div class="verify-title">

                🔎 Digital ID Verification

              </div>


              <div class="verify-text">

                Scan the QR code to open this animal's
                live profile.

              </div>

            </div>


            <div>

              <div
                id="qrcode"
                class="qrcode">
              </div>


              <div class="mini-id">

                ${esc(a.animalId)}

              </div>

            </div>


          </section>


        </main>


        <!-- =================================================
             FOOTER
        ================================================== -->

        <footer class="footer">


          <strong>
            ANIMAL DIGITAL ID
          </strong>

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


  // =======================================================
  // QR CODE
  // =======================================================

  if (window.QRCode) {

    const url =
      `${location.origin}${location.pathname}?id=${encodeURIComponent(a.id)}`;


    const qrElement =
      document.getElementById('qrcode');


    if (qrElement) {

      new QRCode(
        qrElement,
        {
          text: url,
          width: 90,
          height: 90,
          correctLevel: QRCode.CorrectLevel.M
        }
      );

    }

  }

}


// =========================================================
// CLOSE DETAIL POPUP
// =========================================================

function closeDetailModal() {

  const modal =
    document.getElementById("detailModal");


  if (modal) {

    modal.remove();

  }

}


// =========================================================
// BEHAVIOUR & TEMPERAMENT POPUP
// =========================================================

function openBehaviourDetails() {

  // Remove any existing popup first
  closeDetailModal();


  const a = getAnimal();

  const traits =
    getBehaviourTraits(a);


  const traitsHtml = traits.length

    ? traits.map(trait => `
        <span class="trait-pill">
          ${esc(trait)}
        </span>
      `).join('')

    : `
        <span class="not-added">
          No behaviour traits added.
        </span>
      `;


  const modal =
    document.createElement("div");


  modal.id =
    "detailModal";


  modal.className =
    "detail-modal";


  modal.innerHTML = `

    <div class="detail-modal-card">


      <!-- HEADER -->

      <div class="detail-modal-header">


        <div class="detail-modal-title">


          <div class="detail-modal-icon">
            🧠
          </div>


          <div>

            <h3>
              Behaviour & Temperament
            </h3>


            <p>
              ${esc(a.name)}
              •
              ${esc(a.animalId)}
            </p>

          </div>


        </div>


        <button
          type="button"
          class="detail-modal-close"
          aria-label="Close">

          ×

        </button>


      </div>


      <!-- BODY -->

      <div class="detail-modal-body">


        <div class="behaviour-overall">


          <span class="detail-small-label">

            OVERALL BEHAVIOUR

          </span>


          <strong>

            ${esc(
              a.behaviour || "Not Added"
            )}

          </strong>


        </div>


        <div class="traits-section">


          <span class="detail-small-label">

            BEHAVIOUR TRAITS

          </span>


          <div class="traits-list">

            ${traitsHtml}

          </div>


        </div>


        ${
          a.behaviourNotes
            ? `
                <div class="behaviour-notes">

                  <span class="detail-small-label">
                    ADDITIONAL NOTES
                  </span>

                  <p>
                    ${esc(a.behaviourNotes)}
                  </p>

                </div>
              `
            : ''
        }


      </div>


    </div>

  `;


  document.body.appendChild(modal);


  // =======================================================
  // CLOSE BUTTON
  // =======================================================

  const closeButton =
    modal.querySelector(
      ".detail-modal-close"
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      function () {

        closeDetailModal();

      }
    );

  }


  // =======================================================
  // CLICK OUTSIDE
  // =======================================================

  modal.addEventListener(
    "click",
    function (e) {

      if (e.target === modal) {

        closeDetailModal();

      }

    }
  );


  // =======================================================
  // ESC KEY
  // =======================================================

  const escHandler =
    function (e) {

      if (e.key === "Escape") {

        closeDetailModal();

        document.removeEventListener(
          "keydown",
          escHandler
        );

      }

    };


  document.addEventListener(
    "keydown",
    escHandler
  );

}


// =========================================================
// VACCINATION DETAILS POPUP
// =========================================================

function openVaccinationDetails() {

  // Remove any existing popup first
  closeDetailModal();


  const a = getAnimal();


  const vaccinations =
    Array.isArray(a.vaccinations)
      ? a.vaccinations
      : [];


  const rows =
    vaccinations.length


      ? vaccinations.map((v, i) => `

          <tr class="${
            i === vaccinations.length - 1
              ? 'latest'
              : ''
          }">


            <td>
              ${esc(v[0])}
            </td>


            <td>
              ${esc(v[1])}
            </td>


            <td>
              ${esc(v[2])}
            </td>


            <td>

              <span class="vaccine-status">

                ${esc(v[3])}

              </span>

            </td>


          </tr>

        `).join('')


      : `

          <tr>

            <td
              colspan="4"
              class="empty-row">

              Vaccination: Not Done

            </td>

          </tr>

        `;


  const modal =
    document.createElement("div");


  modal.id =
    "detailModal";


  modal.className =
    "detail-modal";


  modal.innerHTML = `

    <div
      class="detail-modal-card vaccination-modal">


      <!-- HEADER -->

      <div class="detail-modal-header">


        <div class="detail-modal-title">


          <div class="detail-modal-icon">

            💉

          </div>


          <div>

            <h3>

              Vaccination Records

            </h3>


            <p>

              ${esc(a.name)}
              •
              ${vaccinations.length}
              record${vaccinations.length === 1 ? '' : 's'}

            </p>

          </div>


        </div>


        <button
          type="button"
          class="detail-modal-close"
          aria-label="Close">

          ×

        </button>


      </div>


      <!-- BODY -->

      <div
        class="detail-modal-body vaccination-modal-body">


        <div class="vaccination-count">


          <strong>

            ${vaccinations.length}

          </strong>


          <span>

            vaccination record${
              vaccinations.length === 1
                ? ''
                : 's'
            }

          </span>


        </div>


        <div
          class="vaccination-table-wrap">


          <table
            class="vaccination-popup-table">


            <thead>

              <tr>

                <th>
                  Vaccine / Record
                </th>

                <th>
                  Date
                </th>

                <th>
                  Next Due
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              ${rows}

            </tbody>


          </table>


        </div>


      </div>


    </div>

  `;


  document.body.appendChild(modal);


  // =======================================================
  // CLOSE BUTTON
  // =======================================================

  const closeButton =
    modal.querySelector(
      ".detail-modal-close"
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      function () {

        closeDetailModal();

      }
    );

  }


  // =======================================================
  // CLICK OUTSIDE
  // =======================================================

  modal.addEventListener(
    "click",
    function (e) {

      if (e.target === modal) {

        closeDetailModal();

      }

    }
  );


  // =======================================================
  // ESC KEY
  // =======================================================

  const escHandler =
    function (e) {

      if (e.key === "Escape") {

        closeDetailModal();

        document.removeEventListener(
          "keydown",
          escHandler
        );

      }

    };


  document.addEventListener(
    "keydown",
    escHandler
  );

}


// =========================================================
// REQUEST A CHANGE
// =========================================================

function openChangeRequest() {


  const a =
    getAnimal();


  // Remove existing form
  const existing =
    document.getElementById(
      "changeRequest"
    );


  if (existing) {

    existing.remove();

    return;

  }


  const modal =
    document.createElement("div");


  modal.id =
    "changeRequest";


  modal.className =
    "change-request";


  modal.innerHTML = `


    <div class="change-request-card">


      <!-- =================================================
           HEADER
      ================================================== -->

      <div class="change-request-header">


        <div class="request-title-area">


          <div class="request-icon">

            📝

          </div>


          <div>

            <h3>
              Request a Change
            </h3>


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
          aria-label="Close">

          ×

        </button>


      </div>


      <!-- =================================================
           NOTICE
      ================================================== -->

      <div class="request-notice">


        <span>
          🔎
        </span>


        <div>

          <strong>
            Information review
          </strong>


          <p>

            Submitted changes are reviewed by
            the registry owner before the
            animal profile is updated.

          </p>

        </div>


      </div>


      <!-- =================================================
           FORM
      ================================================== -->

      <form
        id="animalChangeForm"
        class="change-form"
        action="https://formspree.io/f/xrpgegka"
        method="POST">


        <!-- Hidden Formspree subject -->

        <input
          type="hidden"
          name="_subject"
          value="Animal Registry Change Request">


        <!-- Animal information -->

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


        <!-- =================================================
             FIELD TO CHANGE
        ================================================== -->

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


            <option value="Animal Name">
              Animal Name
            </option>


            <option value="Breed">
              Breed
            </option>


            <option value="Gender">
              Gender
            </option>


            <option value="Date of Birth">
              Date of Birth
            </option>


            <option value="Pet Parent">
              Pet Parent
            </option>


            <option value="Phone">
              Phone
            </option>


            <option value="Alternate Phone">
              Alternate Phone
            </option>


            <option value="Location">
              Location
            </option>


            <option value="Behaviour">
              Behaviour
            </option>


            <option value="Behaviour Traits">
              Behaviour Traits
            </option>


            <option value="Neutering Status">
              Neutering Status
            </option>


            <option value="Vaccination">
              Vaccination
            </option>


            <option value="Photo">
              Photo
            </option>


          </select>


        </div>


        <!-- =================================================
             CURRENT INFORMATION
        ================================================== -->

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


        <!-- =================================================
             REQUESTED INFORMATION
        ================================================== -->

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


        <!-- =================================================
             REASON
        ================================================== -->

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


        <!-- =================================================
             REQUESTER
        ================================================== -->

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


        <!-- =================================================
             FORMSPREE SETTINGS
        ================================================== -->

        <input
          type="hidden"
          name="_captcha"
          value="true">


        <input
          type="hidden"
          name="_template"
          value="table">


        <!-- =================================================
             SUCCESS MESSAGE
        ================================================== -->

        <div
          id="changeRequestSuccess"
          class="request-success"
          style="display:none;">


          <span class="success-icon">
            ✓
          </span>


          <div>

            <strong>
              Request submitted successfully
            </strong>


            <p>

              Your change request has been received
              and will be reviewed by the registry owner.

            </p>

          </div>


        </div>


        <!-- =================================================
             ERROR MESSAGE
        ================================================== -->

        <div
          id="changeRequestError"
          class="request-error"
          style="display:none;">


          <span class="error-icon">
            !
          </span>


          <div>

            <strong>
              Unable to submit request
            </strong>


            <p>

              Something went wrong while sending
              the request. Please try again.

            </p>

          </div>


        </div>


        <!-- =================================================
             BUTTONS
        ================================================== -->

        <div class="request-actions">


          <button
            type="button"
            class="cancel-request">

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


  // =======================================================
  // ELEMENTS
  // =======================================================

  const form =
    document.getElementById(
      "animalChangeForm"
    );


  const submitButton =
    form.querySelector(
      ".submit-change"
    );


  const successBox =
    document.getElementById(
      "changeRequestSuccess"
    );


  const errorBox =
    document.getElementById(
      "changeRequestError"
    );


  const closeButton =
    modal.querySelector(
      ".close-request"
    );


  const cancelButton =
    modal.querySelector(
      ".cancel-request"
    );


  // =======================================================
  // CLOSE BUTTON
  // =======================================================

  closeButton.addEventListener(
    "click",
    function () {

      modal.remove();

    }
  );


  // =======================================================
  // CANCEL BUTTON
  // =======================================================

  cancelButton.addEventListener(
    "click",
    function () {

      modal.remove();

    }
  );


  // =======================================================
  // CLICK OUTSIDE
  // =======================================================

  modal.addEventListener(
    "click",
    function (e) {

      if (e.target === modal) {

        modal.remove();

      }

    }
  );


  // =======================================================
  // ESC KEY
  // =======================================================

  const escHandler =
    function (e) {

      if (e.key === "Escape") {

        if (
          document.getElementById(
            "changeRequest"
          )
        ) {

          modal.remove();

        }


        document.removeEventListener(
          "keydown",
          escHandler
        );

      }

    };


  document.addEventListener(
    "keydown",
    escHandler
  );


  // =======================================================
  // FORMSPREE SUBMISSION
  // =======================================================

  form.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();


      // Hide previous messages

      successBox.style.display =
        "none";


      errorBox.style.display =
        "none";


      // Disable button

      submitButton.disabled =
        true;


      submitButton.textContent =
        "Submitting...";


      const formData =
        new FormData(form);


      try {


        const response =
          await fetch(
            "https://formspree.io/f/xrpgegka",
            {
              method: "POST",

              body: formData,

              headers: {
                Accept:
                  "application/json"
              }
            }
          );


        if (!response.ok) {

          throw new Error(
            "Form submission failed"
          );

        }


        // Hide form

        form.style.display =
          "none";


        // Show success

        successBox.style.display =
          "flex";


      } catch (error) {


        console.error(
          "Change request submission failed:",
          error
        );


        // Re-enable button

        submitButton.disabled =
          false;


        submitButton.textContent =
          "✓ Submit Request";


        // Show error

        errorBox.style.display =
          "flex";

      }

    }
  );

}


// =========================================================
// START PROFILE
// =========================================================

renderProfile();
