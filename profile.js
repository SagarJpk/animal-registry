/* ============================================================
   ANIMAL DIGITAL ID
   PROFILE PAGE
   SUPABASE + RESPONSIVE UI
   ============================================================ */


/* ============================================================
   SUPABASE CONFIGURATION
   ============================================================ */

const SUPABASE_URL =
  "https://qnlatfajpbyefxyyehna.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_w9-d4xchiCpeOnKRas_u2Q_wrFVPOwf";

let supabaseClient = null;


/* ============================================================
   LOAD SUPABASE LIBRARY
   ============================================================ */

function loadSupabaseLibrary() {

  return new Promise(
    (resolve, reject) => {

      if (window.supabase) {

        resolve();

        return;

      }


      const script =
        document.createElement(
          "script"
        );


      script.src =
        "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


      script.onload =
        () => resolve();


      script.onerror =
        () =>
          reject(
            new Error(
              "Unable to load Supabase library"
            )
          );


      document.head.appendChild(
        script
      );

    }
  );

}


/* ============================================================
   STATE
   ============================================================ */

let currentAnimal = null;


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function esc(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#39;"
    );

}


/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatDate(value) {

  if (!value) {
    return "Not Added";
  }

  const date =
    new Date(
      value + "T00:00:00"
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


/* ============================================================
   GET PROFILE ID
   ============================================================ */

function getProfileId() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  return (
    params.get("id") ||
    params.get("animal_id") ||
    ""
  ).trim();

}


/* ============================================================
   NORMALIZE OWNER
   ============================================================ */

function normalizeOwner(
  owner
) {

  if (!owner) {

    return {
      name: "Not Added",
      phone: "",
      alternatePhone: ""
    };

  }

  if (
    Array.isArray(owner)
  ) {

    owner =
      owner[0] || null;

  }

  return {

    name:
      owner?.name ||
      "Not Added",

    phone:
      owner?.phone ||
      owner?.mobile ||
      "",

    alternatePhone:
      owner?.alternate_phone ||
      owner?.alternatePhone ||
      ""

  };

}


/* ============================================================
   NORMALIZE BEHAVIOUR
   ============================================================ */

function normalizeBehaviour(
  behaviour
) {

  if (!behaviour) {

    return {
      temperament: "Not Added",
      traits: [],
      notes: ""
    };

  }

  if (
    Array.isArray(behaviour)
  ) {

    behaviour =
      behaviour[0] || null;

  }

  const traits = [];


  if (
    behaviour?.traits &&
    Array.isArray(
      behaviour.traits
    )
  ) {

    traits.push(
      ...behaviour.traits
    );

  }


  if (
    behaviour?.temperament
  ) {

    return {

      temperament:
        behaviour.temperament,

      traits,

      notes:
        behaviour.notes ||
        behaviour.description ||
        ""

    };

  }


  return {

    temperament:
      behaviour?.behaviour ||
      "Not Added",

    traits,

    notes:
      behaviour?.notes ||
      ""

  };

}


/* ============================================================
   NORMALIZE VACCINATIONS
   ============================================================ */

function normalizeVaccinations(
  vaccinations
) {

  if (
    !Array.isArray(
      vaccinations
    )
  ) {

    return [];

  }

  return vaccinations
    .map(
      vaccination => {

        return [

          vaccination?.vaccine_name ||
          vaccination?.name ||
          vaccination?.vaccine ||
          "Not Added",

          vaccination?.vaccination_date ||
          vaccination?.date ||
          "",

          vaccination?.next_due_date ||
          vaccination?.next_due ||
          "",

          vaccination?.status ||
          "RECORDED"

        ];

      }
    );

}


/* ============================================================
   NORMALIZE WEIGHT HISTORY
   ============================================================ */

function normalizeWeightHistory(
  records
) {

  if (
    !Array.isArray(
      records
    )
  ) {

    return [];

  }

  return records
    .map(
      record => {

        return {

          weight:
            record?.weight,

          unit:
            record?.unit ||
            "kg",

          date:
            record?.recorded_date ||
            record?.date,

          notes:
            record?.notes ||
            ""

        };

      }
    )
    .filter(
      record =>
        record.weight !==
        undefined &&
        record.weight !==
        null
    );

}


/* ============================================================
   NORMALIZE ANIMAL
   ============================================================ */

function normalizeAnimal(
  animal
) {

  const owner =
    normalizeOwner(
      animal?.owners
    );


  const behaviour =
    normalizeBehaviour(
      animal?.behaviour_traits
    );


  return {

    id:
      animal?.id ||
      "",

    animalId:
      animal?.animal_id ||
      "Not Added",

    name:
      animal?.name ||
      "Unnamed Animal",

    type:
      animal?.type ||
      "Not Added",

    breed:
      animal?.breed ||
      "Not Added",

    gender:
      animal?.gender ||
      "Not Added",

    dob:
      animal?.date_of_birth ||
      "",

    photo:
      animal?.photo_url ||
      "",

    colour:
      animal?.colour ||
      "Not Added",

    markings:
      animal?.markings ||
      "Not Added",

    microchipNumber:
      animal?.microchip_number ||
      "Not Added",

    microchipProvider:
      animal?.microchip_provider ||
      "Not Added",

    governmentReference:
      animal?.government_reference ||
      "Not Added",

    identificationNotes:
      animal?.identification_notes ||
      "",

    neutering:
      animal?.neutering_status ||
      animal?.neutered_status ||
      "Not Added",

    status:
      animal?.status ||
      "ACTIVE",

    isLost:
      Boolean(
        animal?.is_lost
      ),

    parent:
      owner.name,

    phone:
      owner.phone,

    alternatePhone:
      owner.alternatePhone,

    behaviour:
      behaviour.temperament,

    behaviourTraits:
      behaviour.traits,

    behaviourNotes:
      behaviour.notes,

    location:
      [
        animal?.location_city,
        animal?.location_state,
        animal?.location_country
      ]
        .filter(Boolean)
        .join(", ") ||
      "Not Added",

    mapUrl:
      animal?.map_url ||
      "",

    vaccinations:
      normalizeVaccinations(
        animal?.vaccinations
      ),

    weightHistory:
      normalizeWeightHistory(
        animal?.weight_history
      )

  };

}


/* ============================================================
   LOAD ANIMAL FROM SUPABASE
   ============================================================ */

async function loadAnimalFromSupabase() {

  try {

    /* ========================================================
       LOAD SUPABASE LIBRARY
       ======================================================== */

    await loadSupabaseLibrary();


    /* ========================================================
       CREATE SUPABASE CLIENT
       ======================================================== */

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );


    /* ========================================================
       GET PROFILE ID
       ======================================================== */

    const profileId =
      getProfileId();


    if (!profileId) {

      showProfileError(
        "No animal ID was provided."
      );

      return;

    }


    /* ========================================================
       LOAD ANIMAL
       ======================================================== */

    let query =
      supabaseClient
        .from("animals")
        .select(`
          *,
          owners (*),
          behaviour_traits (*),
          vaccinations (*),
          weight_history (*)
        `);


    /* ========================================================
       UUID FROM INDEX.HTML
       ======================================================== */

    if (
      profileId.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    ) {

      query =
        query.eq(
          "id",
          profileId
        );

    }

    else {

      /* ======================================================
         ALSO ALLOW ANIMAL ID
         Example:
         ANM-KA-2024-0016503
         ====================================================== */

      query =
        query.eq(
          "animal_id",
          profileId
        );

    }


    /* ========================================================
       EXECUTE QUERY
       ======================================================== */

    const {
      data,
      error
    } = await query.maybeSingle();


    /* ========================================================
       SUPABASE ERROR
       ======================================================== */

    if (error) {

      console.error(
        "Supabase profile loading error:",
        error
      );


      showProfileError(
        "Unable to load this animal profile."
      );


      return;

    }


    /* ========================================================
       ANIMAL NOT FOUND
       ======================================================== */

    if (!data) {

      console.error(
        "Animal profile not found:",
        profileId
      );


      showProfileError(
        "Animal profile not found."
      );


      return;

    }


    /* ========================================================
       NORMALIZE DATA
       ======================================================== */

    currentAnimal =
      normalizeAnimal(
        data
      );


    /* ========================================================
       RENDER PROFILE
       ======================================================== */

    renderProfile();

  }

  catch (error) {

    console.error(
      "Profile loading failed:",
      error
    );


    showProfileError(
      "Unable to load this animal profile right now."
    );

  }

}


/* ============================================================
   ERROR SCREEN
   ============================================================ */

function showProfileError(
  message
) {

  const app =
    document.getElementById(
      "app"
    );

  if (!app) {
    return;
  }

  app.innerHTML = `

    <div class="page">

      <div class="card">

        <main class="content profile-v2-error">

          <div class="profile-v2-error-icon">
            🐾
          </div>

          <h2>
            Animal Profile
          </h2>

          <p>
            ${esc(message)}
          </p>

          <a
            href="./index.html"
            class="profile-v2-button primary">

            ← Back to Registry

          </a>

        </main>

      </div>

    </div>

  `;

}


/* ============================================================
   DETAIL FIELD
   ============================================================ */

function detail(
  label,
  value,
  icon = ""
) {

  return `

    <div class="profile-v2-detail">

      <span class="profile-v2-detail-label">

        ${
          icon
            ? `<span>${icon}</span>`
            : ""
        }

        ${esc(label)}

      </span>

      <strong class="profile-v2-detail-value">

        ${esc(
          value ||
          "Not Added"
        )}

      </strong>

    </div>

  `;

}


/* ============================================================
   GET BEHAVIOUR TRAITS
   ============================================================ */

function getBehaviourTraits(
  animal
) {

  if (
    !animal
  ) {
    return [];
  }

  if (
    Array.isArray(
      animal.behaviourTraits
    )
  ) {

    return animal.behaviourTraits;

  }

  return [];

}


/* ============================================================
   GET LATEST VACCINATION
   ============================================================ */

function getLatestVaccination(
  animal
) {

  const records =
    Array.isArray(
      animal?.vaccinations
    )
      ? animal.vaccinations
      : [];

  if (
    !records.length
  ) {
    return null;
  }

  return records[
    records.length - 1
  ];

}


/* ============================================================
   THEME
   ============================================================ */

function applyProfileTheme(
  theme
) {

  const isDark =
    theme === "dark";


  document.body.classList.toggle(
    "dark-mode",
    isDark
  );


  const button =
    document.getElementById(
      "profileThemeToggle"
    );


  if (!button) {
    return;
  }


  const icon =
    button.querySelector(
      ".profile-theme-icon"
    );


  const text =
    button.querySelector(
      ".profile-theme-text"
    );


  if (icon) {

    icon.textContent =
      isDark
        ? "☀️"
        : "🌙";

  }


  if (text) {

    text.textContent =
      isDark
        ? "Light"
        : "Dark";

  }


  button.setAttribute(
    "aria-label",
    isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
  );

}


/* ============================================================
   SETUP THEME
   ============================================================ */

function setupProfileTheme() {

  const savedTheme =
    localStorage.getItem(
      "animalDigitalIdTheme"
    );


  applyProfileTheme(
    savedTheme === "dark"
      ? "dark"
      : "light"
  );


  const button =
    document.getElementById(
      "profileThemeToggle"
    );


  if (
    !button ||
    button.dataset.bound
  ) {
    return;
  }


  button.dataset.bound =
    "true";


  button.addEventListener(
    "click",
    function () {

      const nextTheme =
        document.body.classList.contains(
          "dark-mode"
        )
          ? "light"
          : "dark";


      localStorage.setItem(
        "animalDigitalIdTheme",
        nextTheme
      );


      applyProfileTheme(
        nextTheme
      );

    }
  );

}


/* ============================================================
   PART 1 END
   ============================================================ */
   /* ============================================================
   RENDER PROFILE
   ============================================================ */

function renderProfile() {

  const a = currentAnimal;

  if (!a) {

    showProfileError(
      "Animal profile could not be loaded."
    );

    return;

  }


  document.title =
    `${a.name} | Animal Digital ID`;


  const traits =
    getBehaviourTraits(a);


  const vaccinations =
    Array.isArray(a.vaccinations)
      ? a.vaccinations
      : [];


  const weights =
    Array.isArray(a.weightHistory)
      ? a.weightHistory
      : [];


  const latestWeight =
  weights.length
    ? [...weights].sort(
        (a, b) => {
          const aDate =
            new Date(a.date || 0).getTime();

          const bDate =
            new Date(b.date || 0).getTime();

          return bDate - aDate;
        }
      )[0]
    : null;


  const latestVaccine =
    getLatestVaccination(a);


  const location =
    a.location &&
    a.location !== "Not Added"
      ? a.location
      : "Location not added";


  const isLost =
    Boolean(a.isLost) ||
    /lost/i.test(
      String(a.status || "")
    );


  const statusLabel =
    isLost
      ? "LOST"
      : "ACTIVE RECORD";


  const statusClass =
    isLost
      ? "lost"
      : "active";


  const phoneHtml =
    a.phone

      ? `
        <a
          href="tel:${esc(a.phone)}"
          class="profile-v2-contact-link">

          ${esc(a.phone)}

        </a>
      `

      : `
        <span>
          Not Added
        </span>
      `;


  const alternateHtml =
    a.alternatePhone

      ? `
        <a
          href="tel:${esc(a.alternatePhone)}"
          class="profile-v2-contact-link">

          ${esc(a.alternatePhone)}

        </a>
      `

      : `
        <span>
          Not Added
        </span>
      `;


  const mapHtml =
    a.mapUrl

      ? `
        <a
          href="${esc(a.mapUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="profile-v2-location-button">

          📍 Open Map

        </a>
      `

      : `
        <span
          class="profile-v2-location-button disabled">

          📍 Map not added

        </span>
      `;


  const traitHtml =
    traits.length

      ? traits
          .map(
            trait => `

              <span
                class="profile-v2-trait">

                ${esc(trait)}

              </span>

            `
          )
          .join("")

      : `

          <span
            class="profile-v2-muted">

            No behaviour traits added

          </span>

        `;


  let vaccineName =
    "Not Done";

  let vaccineDue =
    "Not Added";


  if (latestVaccine) {

    vaccineName =
      latestVaccine[0] ||
      "Not Added";

    vaccineDue =
      latestVaccine[2] ||
      "Not Added";

  }


  const vaccineRows =
    vaccinations.length

      ? vaccinations
          .map(
            (v, index) => `

              <tr
                class="${
                  index ===
                  vaccinations.length - 1
                    ? "latest"
                    : ""
                }">

                <td>
                  ${esc(
                    v[0] ||
                    "Not Added"
                  )}
                </td>

                <td>
                  ${esc(
                    formatDisplayDate(
                      v[1]
                    )
                  )}
                </td>

                <td>
                  ${esc(
                    formatDisplayDate(
                      v[2]
                    )
                  )}
                </td>

                <td>

                  <span
                    class="profile-v2-table-status">

                    ${esc(
                      v[3] ||
                      "RECORDED"
                    )}

                  </span>

                </td>

              </tr>

            `
          )
          .join("")

      : `

          <tr>

            <td
              colspan="4"
              class="profile-v2-empty-row">

              Vaccination: Not Done

            </td>

          </tr>

        `;


 const qrUrl =
  "https://sagarjpk.github.io/animal-registry/profile.html?id=" +
  encodeURIComponent(a.id);


  /* ==========================================================
     PROFILE HTML
     ========================================================== */

  const app =
    document.getElementById("app");


  if (!app) {

    console.error(
      "Profile app container not found."
    );

    return;

  }


  app.innerHTML = `

    <div class="page profile-v2-page">

      <div class="card profile-v2-card">


        <!-- ==================================================
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
                Private animal registry • individual digital profiles
              </p>

            </div>

          </div>


        <nav class="nav profile-header-nav">

  <a
    href="./index.html"
    class="profile-header-home"
  >
    Home
  </a>


  <a
    href="./index.html"
    class="profile-v2-back"
  >
    ← Back to Registry
  </a>


  <button
    id="profilePetParentDashboard"
    type="button"
    class="profile-v2-dashboard"
    style="display:none"
    onclick="goToPetParentDashboard()"
  >
    🐾 Pet Parent Dashboard
  </button>


  <button
    type="button"
    class="profile-v2-action profile-v2-print"
    onclick="printAnimalDigitalId()"
    title="Print or save this Digital ID as PDF"
  >
    🖨️ Print / PDF
  </button>


  <button
    type="button"
    class="profile-v2-action profile-v2-share"
    onclick="shareAnimalDigitalId()"
    title="Share this Digital ID"
  >
    ↗️ Share
  </button>


  <button
    type="button"
    class="profile-v2-change"
    onclick="openChangeRequest()"
  >
    📝 Request a Change
  </button>

</nav>

        </header>


        <main class="content profile-v2-content">


          <!-- ==================================================
               PRIVATE NOTICE
          ================================================== -->

          <div
            class="notice profile-v2-notice">

            <span>
              🛡️
            </span>

            <span>

              <strong>
                Private Animal Digital ID
              </strong>

              This record is privately maintained
              by the owner and is not a
              government-issued identity document.

            </span>

          </div>


          <!-- ==================================================
               PROFILE HERO
          ================================================== -->

          <section class="profile-v2-hero">


            <!-- PHOTO -->

            <div class="profile-v2-photo-area">

              <div
                class="profile-v2-photo-frame">

                ${
                  a.photo

                    ? `

                      <img
                        src="${esc(a.photo)}"
                        alt="${esc(a.name)}"
                        class="profile-v2-photo">

                    `

                    : `

                      <div
                        class="profile-v2-photo-empty">

                        🐾

                        <span>
                          No photo uploaded
                        </span>

                      </div>

                    `
                }


                <div
                  class="profile-v2-status ${statusClass}">

                  ✓ ${esc(statusLabel)}

                </div>

              </div>


              <div
                class="profile-v2-photo-caption">

                Registered photograph

              </div>

            </div>


            <!-- PROFILE INFORMATION -->

            <div
              class="profile-v2-hero-info">


              <div
                class="profile-v2-eyebrow">

                ANIMAL DIGITAL PROFILE

              </div>


              <h2>
                ${esc(a.name)}
              </h2>


              <div
                class="profile-v2-id">

                ${esc(a.animalId)}

              </div>


              <p
                class="profile-v2-intro">

                A live digital identity record containing
                registered identity, behaviour, health,
                location and contact information.

              </p>


              <div
                class="profile-v2-quick-grid">


                ${detail(
                  "Type",
                  a.type,
                  "🐾"
                )}


                ${detail(
                  "Breed",
                  a.breed,
                  "🧬"
                )}


                ${detail(
                  "Gender",
                  a.gender,
                  "⚥"
                )}


                ${detail(
                  "Date of Birth",
                  formatDate(a.dob),
                  "🎂"
                )}


              </div>

            </div>

          </section>


          <!-- ==================================================
               OVERVIEW
          ================================================== -->

          <section
            class="profile-v2-overview">


            <div
              class="profile-v2-overview-item">

              <span>
                BEHAVIOUR
              </span>

              <strong>
                ${esc(a.behaviour)}
              </strong>

            </div>


            <div
              class="profile-v2-overview-item">

              <span>
                PET PARENT
              </span>

              <strong>
                ${esc(a.parent)}
              </strong>

            </div>


            <div
              class="profile-v2-overview-item">

              <span>
                LOCATION
              </span>

              <strong>
                ${esc(location)}
              </strong>

            </div>


            <div
              class="profile-v2-overview-item">

              <span>
                RECORD
              </span>

              <strong>
                ${esc(statusLabel)}
              </strong>

            </div>


          </section>


          <!-- ==================================================
               IDENTITY SECTION
          ================================================== -->

          <section
            class="profile-v2-section">


            <div
              class="profile-v2-section-heading">

              <div>

                <span
                  class="profile-v2-section-kicker">

                  IDENTITY

                </span>

                <h3>
                  Registered Information
                </h3>

              </div>


              <span
                class="profile-v2-section-icon">

                🪪

              </span>

            </div>


            <div
              class="profile-v2-detail-grid">


              ${detail(
                "Animal Name",
                a.name
              )}


              ${detail(
                "Animal ID",
                a.animalId
              )}


              ${detail(
                "Type",
                a.type
              )}


              ${detail(
                "Breed",
                a.breed
              )}


              ${detail(
                "Gender",
                a.gender
              )}


              ${detail(
                "Date of Birth",
                formatDate(a.dob)
              )}


              ${detail(
                "Neutering Status",
                a.neutering
              )}


              ${detail(
                "Record Status",
                statusLabel
              )}


            </div>

          </section>


          <!-- ==================================================
               BEHAVIOUR
          ================================================== -->

          <section
            class="profile-v2-section">


            <div
              class="profile-v2-section-heading">

              <div>

                <span
                  class="profile-v2-section-kicker">

                  PERSONALITY

                </span>

                <h3>
                  Behaviour & Temperament
                </h3>

              </div>


              <span
                class="profile-v2-section-icon">

                🧠

              </span>

            </div>


            <div
              class="profile-v2-behaviour-card">


              <div
                class="profile-v2-behaviour-main">

                <span>
                  OVERALL BEHAVIOUR
                </span>

                <strong>
                  ${esc(a.behaviour)}
                </strong>


                <button
                  type="button"
                  class="profile-v2-outline-button"
                  onclick="openBehaviourDetails()">

                  View Details

                </button>

              </div>


              <div
                class="profile-v2-traits-area">

                <span>
                  BEHAVIOUR TRAITS
                </span>


                <div
                  class="profile-v2-traits">

                  ${traitHtml}

                </div>

              </div>


            </div>

          </section>


          <!-- ==================================================
               HEALTH
          ================================================== -->

          <section
            class="profile-v2-health-grid">


            <!-- VACCINATION -->

            <div
              class="profile-v2-section profile-v2-health-card">


              <div
                class="profile-v2-section-heading">

                <div>

                  <span
                    class="profile-v2-section-kicker">

                    HEALTH

                  </span>

                  <h3>
                    Vaccinations
                  </h3>

                </div>


                <span
                  class="profile-v2-section-icon">

                  💉

                </span>

              </div>


              <div
                class="profile-v2-health-stat-grid">


                <div>

                  <span>
                    TOTAL RECORDS
                  </span>

                  <strong>
                    ${vaccinations.length}
                  </strong>

                </div>


                <div>

                  <span>
                    LATEST VACCINE
                  </span>

                  <strong>
                    ${esc(vaccineName)}
                  </strong>

                </div>


                <div>

                  <span>
                    NEXT DUE
                  </span>

                  <strong>
                    ${esc(
                      formatDate(
                        vaccineDue
                      )
                    )}
                  </strong>

                </div>


              </div>


              <button
                type="button"
                class="profile-v2-full-button"
                onclick="openVaccinationDetails()">

                View Vaccination History →

              </button>


            </div>


            <!-- WEIGHT -->

            <div
              class="profile-v2-section profile-v2-health-card">


              <div
                class="profile-v2-section-heading">

                <div>

                  <span
                    class="profile-v2-section-kicker">

                    HEALTH

                  </span>

                  <h3>
                    Weight
                  </h3>

                </div>


                <span
                  class="profile-v2-section-icon">

                  ⚖️

                </span>

              </div>


              ${
                latestWeight

                  ? `

                    <div
                      class="profile-v2-weight-highlight">


                      <div>

                        <span>
                          LATEST WEIGHT
                        </span>

                        <strong>

                          ${esc(
                            latestWeight.weight
                          )}

                          ${esc(
                            latestWeight.unit
                          )}

                        </strong>

                      </div>


                      <div>

                        <span>
                          RECORDED
                        </span>

                        <strong>

                          ${esc(
                            formatDate(
                              latestWeight.date
                            )
                          )}

                        </strong>

                      </div>


                    </div>

                  `

                  : `

                    <div
                      class="profile-v2-empty-health">

                      No weight records added.

                    </div>

                  `
              }


              <button
                type="button"
                class="profile-v2-full-button"
                onclick="openWeightDetails()">

                View Weight History →

              </button>


            </div>


          </section>


          <!-- ==================================================
               LOCATION + CONTACT
          ================================================== -->

          <section
            class="profile-v2-two-column">


            <!-- LOCATION -->

            <div
              class="profile-v2-section">


              <div
                class="profile-v2-section-heading">

                <div>

                  <span
                    class="profile-v2-section-kicker">

                    LOCATION

                  </span>

                  <h3>
                    Registered Location
                  </h3>

                </div>


                <span
                  class="profile-v2-section-icon">

                  📍

                </span>

              </div>


              <div
                class="profile-v2-location-card">


                <div>

                  <strong>
                    ${esc(location)}
                  </strong>

                  <span>

                    Registered location for
                    ${esc(a.name)}

                  </span>

                </div>


                ${mapHtml}


              </div>


            </div>


            <!-- CONTACT -->

            <div
              class="profile-v2-section">


              <div
                class="profile-v2-section-heading">

                <div>

                  <span
                    class="profile-v2-section-kicker">

                    CONTACT

                  </span>

                  <h3>
                    Pet Parent
                  </h3>

                </div>


                <span
                  class="profile-v2-section-icon">

                  📞

                </span>

              </div>


              <div
                class="profile-v2-contact-grid">


                <div>

                  <span>
                    NAME
                  </span>

                  <strong>
                    ${esc(a.parent)}
                  </strong>

                </div>


                <div>

                  <span>
                    PHONE
                  </span>

                  ${phoneHtml}

                </div>


                <div>

                  <span>
                    ALTERNATE
                  </span>

                  ${alternateHtml}

                </div>


                <div>

                  <span>
                    BEHAVIOUR
                  </span>

                  <strong>
                    ${esc(a.behaviour)}
                  </strong>

                </div>


              </div>


            </div>


          </section>


          <!-- ==================================================
               VERIFICATION
          ================================================== -->

          <section
            class="profile-v2-verification">


            <div
              class="profile-v2-verification-copy">


              <span
                class="profile-v2-section-kicker">

                VERIFY THIS RECORD

              </span>


              <h3>
                Digital ID Verification
              </h3>


              <p>

                Scan this QR code to open the live
                profile for ${esc(a.name)}.

              </p>


              <div
                class="profile-v2-verify-id">

                ${esc(a.animalId)}

              </div>


            </div>


            <div
              class="profile-v2-qr-wrap">


              <div
                id="qrcode"
                class="profile-v2-qr">
              </div>


              <span>
                Scan to verify
              </span>


              <button
                type="button"
                class="profile-v2-verify-button"
                onclick="openLiveVerification()"
              >
                🔎 Open Live Verification
              </button>


            </div>


          </section>


          <!-- ==================================================
               FOOTER
          ================================================== -->

          <footer
            class="footer profile-v2-footer">


            <div>

              <strong>
                ANIMAL DIGITAL ID
              </strong>

              <span>
                Every animal matters
              </span>

            </div>


            <div
              class="profile-v2-footer-note">

              Private owner-maintained record
              • Not a government-issued identity document

            </div>


          </footer>


        </main>

      </div>

    </div>


    <!-- ======================================================
         THEME TOGGLE
    ======================================================= -->

    <button
      id="profileThemeToggle"
      class="theme-toggle"
      type="button"
      aria-label="Switch to dark mode"
      title="Switch to dark mode">


      <span
        class="profile-theme-icon">

        🌙

      </span>


      <span
        class="profile-theme-text">

        Dark

      </span>


    </button>

  `;


  /* ==========================================================
     QR CODE
     ========================================================== */

  const qrElement =
    document.getElementById(
      "qrcode"
    );


  if (
    qrElement &&
    window.QRCode
  ) {

    qrElement.innerHTML = "";


    new QRCode(
      qrElement,
      {
        text: qrUrl,
        width: 128,
        height: 128,
        correctLevel:
          QRCode.CorrectLevel.M
      }
    );

  }


  /* ==========================================================
     THEME
     ========================================================== */

  setupProfileTheme();

  setupPetParentProfileNavigation();

}

/* ============================================================
   DIGITAL ID ACTIONS
   Print, PDF, Share and Live Verification
   ============================================================ */

function getAnimalDigitalIdUrl() {

  const a = currentAnimal;

  if (!a || !a.id) {
    return window.location.href;
  }

   return (
    `https://sagarjpk.github.io/animal-registry/profile.html` +
    `?id=${encodeURIComponent(a.id)}`
  );

}


/* ============================================================
   PRINT / SAVE AS PDF
   ============================================================ */

function printAnimalDigitalId() {

  if (!currentAnimal) {
    showProfileToast(
      "Animal Digital ID is still loading."
    );
    return;
  }

  window.print();

}


/* ============================================================
   SHARE DIGITAL ID
   ============================================================ */

async function shareAnimalDigitalId() {

  const a = currentAnimal;

  if (!a) {
    showProfileToast(
      "Animal Digital ID is still loading."
    );
    return;
  }

  const url =
    getAnimalDigitalIdUrl();

  const shareData = {
    title:
      `${a.name} | Animal Digital ID`,
    text:
      `View the verified Digital ID for ${a.name} (${a.animalId}).`,
    url
  };


  try {

    if (
      navigator.share &&
      typeof navigator.share === "function"
    ) {

      await navigator.share(
        shareData
      );

      return;

    }


    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard.writeText(
        url
      );

      showProfileToast(
        "Digital ID link copied to clipboard."
      );

      return;

    }


    const temporaryInput =
      document.createElement("textarea");

    temporaryInput.value = url;

    temporaryInput.style.position =
      "fixed";
    temporaryInput.style.opacity =
      "0";

    document.body.appendChild(
      temporaryInput
    );

    temporaryInput.select();

    document.execCommand(
      "copy"
    );

    temporaryInput.remove();

    showProfileToast(
      "Digital ID link copied to clipboard."
    );

  }

  catch (error) {

    console.error(
      "Digital ID sharing failed:",
      error
    );

    showProfileToast(
      "Unable to share the Digital ID right now."
    );

  }

}


/* ============================================================
   OPEN LIVE VERIFICATION
   ============================================================ */

function openLiveVerification() {

  const url =
    getAnimalDigitalIdUrl();

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}


/* ============================================================
   SMALL ACTION TOAST
   ============================================================ */

function showProfileToast(
  message
) {

  const existing =
    document.getElementById(
      "profileActionToast"
    );

  if (existing) {
    existing.remove();
  }


  const toast =
    document.createElement("div");

  toast.id =
    "profileActionToast";

  toast.className =
    "profile-action-toast";

  toast.textContent =
    message;

  document.body.appendChild(
    toast
  );


  requestAnimationFrame(
    () => {
      toast.classList.add(
        "show"
      );
    }
  );


  window.setTimeout(
    () => {

      toast.classList.remove(
        "show"
      );

      window.setTimeout(
        () => toast.remove(),
        220
      );

    },
    2600
  );

}


/* ============================================================
   PET PARENT PROFILE NAVIGATION
   ============================================================ */

async function setupPetParentProfileNavigation() {

  const dashboardButton =
    document.getElementById(
      "profilePetParentDashboard"
    );


  if (!dashboardButton) {
    return;
  }


  try {

    if (!supabaseClient) {
      return;
    }


    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (
      error ||
      !data ||
      !data.session ||
      !data.session.user
    ) {

      dashboardButton.style.display =
        "none";

      return;

    }


const {
  data: profile,
  error: profileError
} =
  await supabaseClient
    .from("profiles")
    .select(
      "id,role"
    )
    .eq(
      "id",
      data.session.user.id
    )
    .maybeSingle();


if (
  profileError ||
  !profile ||
  profile.role !== "owner"
) {

  dashboardButton.style.display =
    "none";

  return;
}


    dashboardButton.style.display =
      "inline-flex";

  }

  catch (error) {

    console.error(
      "Pet Parent profile navigation check failed:",
      error
    );


    dashboardButton.style.display =
      "none";

  }

}


function goToPetParentDashboard() {

  window.location.href =
    "./owner-dashboard.html";

}

/* ============================================================
   PART 2 END
   ============================================================ */
   /* ============================================================
   DATE DISPLAY HELPER
   ============================================================ */

function formatDisplayDate(value) {

  if (!value) {
    return "Not Added";
  }


  const date =
    new Date(
      value + "T00:00:00"
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


/* ============================================================
   CLOSE MODAL
   ============================================================ */

function closeProfileModal() {

  const modal =
    document.querySelector(
      ".profile-v2-modal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "show"
  );


  setTimeout(
    () => {

      if (modal.parentNode) {

        modal.parentNode.removeChild(
          modal
        );

      }

    },
    180
  );

}


/* ============================================================
   CREATE MODAL
   ============================================================ */

function createProfileModal(
  content
) {

  closeProfileModal();


  const modal =
    document.createElement(
      "div"
    );


  modal.className =
    "profile-v2-modal";


  modal.innerHTML = `

    <div
      class="profile-v2-modal-backdrop">
    </div>


    <div
      class="profile-v2-modal-dialog"
      role="dialog"
      aria-modal="true">


      <button
        type="button"
        class="profile-v2-modal-close"
        aria-label="Close">

        ×

      </button>


      <div
        class="profile-v2-modal-content">

        ${content}

      </div>


    </div>

  `;


  document.body.appendChild(
    modal
  );


  const closeButton =
    modal.querySelector(
      ".profile-v2-modal-close"
    );


  const backdrop =
    modal.querySelector(
      ".profile-v2-modal-backdrop"
    );


  if (closeButton) {

    closeButton.addEventListener(
      "click",
      closeProfileModal
    );

  }


  if (backdrop) {

    backdrop.addEventListener(
      "click",
      closeProfileModal
    );

  }


  document.addEventListener(
    "keydown",
    handleProfileEscape
  );


  requestAnimationFrame(
    () => {

      modal.classList.add(
        "show"
      );

    }
  );


  return modal;

}


/* ============================================================
   ESCAPE KEY
   ============================================================ */

function handleProfileEscape(
  event
) {

  if (
    event.key ===
    "Escape"
  ) {

    closeProfileModal();


    document.removeEventListener(
      "keydown",
      handleProfileEscape
    );

  }

}


/* ============================================================
   BEHAVIOUR DETAILS
   ============================================================ */

function openBehaviourDetails() {

  const a =
    currentAnimal;


  if (!a) {
    return;
  }


  const traits =
    getBehaviourTraits(a);


  const traitsHtml =
    traits.length

      ? traits
          .map(
            trait => `

              <span
                class="profile-v2-trait">

                ${esc(trait)}

              </span>

            `
          )
          .join("")

      : `

          <p
            class="profile-v2-modal-muted">

            No behaviour traits have been added.

          </p>

        `;


  createProfileModal(`

    <div
      class="profile-v2-modal-kicker">

      PERSONALITY

    </div>


    <h2>
      ${esc(a.name)}'s Behaviour
    </h2>


    <div
      class="profile-v2-modal-highlight">

      <span>
        OVERALL TEMPERAMENT
      </span>

      <strong>
        ${esc(a.behaviour)}
      </strong>

    </div>


    <div
      class="profile-v2-modal-section">

      <span
        class="profile-v2-modal-label">

        BEHAVIOUR TRAITS

      </span>


      <div
        class="profile-v2-traits">

        ${traitsHtml}

      </div>

    </div>


    ${
      a.behaviourNotes

        ? `

          <div
            class="profile-v2-modal-section">

            <span
              class="profile-v2-modal-label">

              NOTES

            </span>


            <p
              class="profile-v2-modal-text">

              ${esc(
                a.behaviourNotes
              )}

            </p>

          </div>

        `

        : ""
    }

  `);

}


/* ============================================================
   WEIGHT HISTORY
   ============================================================ */

function openWeightDetails() {

  const a =
    currentAnimal;


  if (!a) {
    return;
  }


  const records =
    Array.isArray(
      a.weightHistory
    )
      ? [...a.weightHistory]
      : [];


  records.sort(
    (x, y) => {

      const xDate =
        new Date(
          x.date ||
          0
        ).getTime();


      const yDate =
        new Date(
          y.date ||
          0
        ).getTime();


      return yDate - xDate;

    }
  );


  const rows =
    records.length

      ? records
          .map(
            record => `

              <tr>

                <td>

                  ${esc(
                    formatDisplayDate(
                      record.date
                    )
                  )}

                </td>


                <td>

                  <strong>

                    ${esc(
                      record.weight
                    )}

                    ${esc(
                      record.unit ||
                      "kg"
                    )}

                  </strong>

                </td>


                <td>

                  ${esc(
                    record.notes ||
                    "No notes"
                  )}

                </td>

              </tr>

            `
          )
          .join("")

      : `

          <tr>

            <td
              colspan="3"
              class="profile-v2-empty-row">

              No weight records available.

            </td>

          </tr>

        `;


  createProfileModal(`

    <div
      class="profile-v2-modal-kicker">

      HEALTH

    </div>


    <h2>
      ${esc(a.name)}'s Weight History
    </h2>


    <p
      class="profile-v2-modal-description">

      Recorded weight measurements maintained
      as part of the animal's digital health record.

    </p>


    <div
      class="profile-v2-modal-table-wrap">


      <table
        class="profile-v2-modal-table">


        <thead>

          <tr>

            <th>
              Date
            </th>

            <th>
              Weight
            </th>

            <th>
              Notes
            </th>

          </tr>

        </thead>


        <tbody>

          ${rows}

        </tbody>


      </table>


    </div>

  `);

}


/* ============================================================
   VACCINATION HISTORY
   ============================================================ */

function openVaccinationDetails() {

  const a =
    currentAnimal;


  if (!a) {
    return;
  }


  const records =
    Array.isArray(
      a.vaccinations
    )
      ? a.vaccinations
      : [];


  const rows =
    records.length

      ? records
          .map(
            record => `

              <tr>

                <td>

                  <strong>

                    ${esc(
                      record[0] ||
                      "Not Added"
                    )}

                  </strong>

                </td>


                <td>

                  ${esc(
                    formatDisplayDate(
                      record[1]
                    )
                  )}

                </td>


                <td>

                  ${esc(
                    formatDisplayDate(
                      record[2]
                    )
                  )}

                </td>


                <td>

                  <span
                    class="profile-v2-table-status">

                    ${esc(
                      record[3] ||
                      "RECORDED"
                    )}

                  </span>

                </td>

              </tr>

            `
          )
          .join("")

      : `

          <tr>

            <td
              colspan="4"
              class="profile-v2-empty-row">

              No vaccination records available.

            </td>

          </tr>

        `;


  createProfileModal(`

    <div
      class="profile-v2-modal-kicker">

      HEALTH

    </div>


    <h2>
      ${esc(a.name)}'s Vaccination History
    </h2>


    <p
      class="profile-v2-modal-description">

      Vaccination records maintained as part
      of the animal's digital health record.

    </p>


    <div
      class="profile-v2-modal-table-wrap">


      <table
        class="profile-v2-modal-table">


        <thead>

          <tr>

            <th>
              Vaccine
            </th>

            <th>
              Vaccination Date
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

  `);

}


/* ============================================================
   PART 3 END
   ============================================================ */
   /* ============================================================
   REQUEST A CHANGE
   ============================================================ */

function openChangeRequest() {

  const a =
    currentAnimal;


  if (!a) {
    return;
  }


  createProfileModal(`

    <div
      class="profile-v2-modal-kicker">

      PROFILE UPDATE

    </div>


    <h2>
      Request a Change
    </h2>


    <p
      class="profile-v2-modal-description">

      If any information in this profile needs
      to be corrected or updated, submit a request
      to the registry administrator.

    </p>


    <form
      id="profileChangeForm"
      class="profile-v2-change-form">


      <div
        class="profile-v2-form-grid">


        <div
          class="profile-v2-form-group">

          <label
            for="changeAnimalName">

            Animal

          </label>

          <input
            id="changeAnimalName"
            type="text"
            value="${esc(a.name)}"
            readonly>

        </div>


        <div
          class="profile-v2-form-group">

          <label
            for="changeAnimalId">

            Animal ID

          </label>

          <input
            id="changeAnimalId"
            type="text"
            value="${esc(a.animalId)}"
            readonly>

        </div>


      </div>


      <div
        class="profile-v2-form-group">

        <label
          for="changeRequester">

          Your Name

        </label>

        <input
          id="changeRequester"
          name="name"
          type="text"
          placeholder="Enter your name"
          required>

      </div>


      <div
        class="profile-v2-form-group">

        <label
          for="changeEmail">

          Email Address

        </label>

        <input
          id="changeEmail"
          name="email"
          type="email"
          placeholder="Enter your email address"
          required>

      </div>


      <div
        class="profile-v2-form-group">

        <label
          for="changeType">

          Change Type

        </label>

        <select
          id="changeType"
          name="change_type"
          required>

          <option value="">
            Select a change type
          </option>

          <option value="Name">
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

          <option value="Owner">
            Owner Information
          </option>

          <option value="Phone">
            Contact Number
          </option>

          <option value="Location">
            Location
          </option>

          <option value="Behaviour">
            Behaviour / Traits
          </option>

          <option value="Vaccination">
            Vaccination
          </option>

          <option value="Weight">
            Weight
          </option>

          <option value="Other">
            Other
          </option>

        </select>

      </div>


      <div
        class="profile-v2-form-group">

        <label
          for="changeMessage">

          Requested Change

        </label>

        <textarea
          id="changeMessage"
          name="message"
          rows="5"
          placeholder="Describe the information that needs to be changed..."
          required></textarea>

      </div>


      <div
        class="profile-v2-form-group">

        <label
          for="changeAttachment">

          Supporting Document <span style="font-weight:600;opacity:.65">(Optional)</span>

        </label>

        <input
          id="changeAttachment"
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onchange="handleChangeRequestAttachment(this)">

        <small
          id="changeAttachmentHelp"
          style="display:block;color:#718996;font-size:8px;line-height:1.5">
          PDF, JPG or PNG • Maximum 5 MB • Vaccination records, medical reports, ownership documents or supporting photos
        </small>

        <div
          id="changeAttachmentName"
          style="display:none;padding:9px 11px;border-radius:10px;background:#eef7f4;color:#0e8060;font-size:8px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
        </div>

      </div>


      <div
        id="changeRequestStatus"
        class="profile-v2-form-status">
      </div>


      <div
        class="profile-v2-form-actions">


        <button
          type="button"
          class="profile-v2-outline-button"
          onclick="closeProfileModal()">

          Cancel

        </button>


        <button
          type="submit"
          class="profile-v2-submit-button">

          Submit Request

        </button>


      </div>


    </form>

  `);


  const form =
    document.getElementById(
      "profileChangeForm"
    );


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    submitChangeRequest
  );

}


/* ============================================================
   SUBMIT CHANGE REQUEST
   ============================================================ */

function handleChangeRequestAttachment(input) {

  const file =
    input?.files?.[0];

  const nameBox =
    document.getElementById(
      "changeAttachmentName"
    );

  const status =
    document.getElementById(
      "changeRequestStatus"
    );

  if (!file) {
    if (nameBox) {
      nameBox.style.display = "none";
      nameBox.textContent = "";
    }
    return;
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  const maxSize =
    5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    input.value = "";

    if (nameBox) {
      nameBox.style.display = "none";
      nameBox.textContent = "";
    }

    if (status) {
      status.textContent =
        "Please select a PDF, JPG or PNG file.";
      status.className =
        "profile-v2-form-status error";
    }

    return;
  }

  if (file.size > maxSize) {
    input.value = "";

    if (nameBox) {
      nameBox.style.display = "none";
      nameBox.textContent = "";
    }

    if (status) {
      status.textContent =
        "The attachment must be 5 MB or smaller.";
      status.className =
        "profile-v2-form-status error";
    }

    return;
  }

  if (nameBox) {
    nameBox.style.display = "block";
    nameBox.textContent =
      `📎 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
  }

  if (status) {
    status.textContent = "";
    status.className =
      "profile-v2-form-status";
  }
}


async function uploadChangeRequestAttachment(
  file,
  animalId
) {

  if (!file) {
    return null;
  }

  const safeName =
    String(file.name || "attachment")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-120);

  const uniqueId =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const path =
    `change-requests/${encodeURIComponent(animalId || "animal")}/${uniqueId}-${safeName}`;

  const {
    data,
    error
  } = await supabaseClient
    .storage
    .from("change-request-attachments")
    .upload(
      path,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      }
    );

  if (error) {
    console.error(
      "Change request attachment upload failed:",
      error
    );

    throw new Error(
      "The supporting document could not be uploaded. Please try again."
    );
  }

  return {
    path: data?.path || path,
    name: file.name,
    type: file.type,
    size: file.size
  };
}


/* ============================================================
   SUBMIT CHANGE REQUEST
   ============================================================ */

async function submitChangeRequest(
  event
) {

  event.preventDefault();


  const form =
    event.currentTarget;


  const status =
    document.getElementById(
      "changeRequestStatus"
    );


  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );


  const a =
    currentAnimal;


  if (!a) {
    return;
  }


  const requester =
    document.getElementById(
      "changeRequester"
    )?.value.trim();


  const email =
    document.getElementById(
      "changeEmail"
    )?.value.trim();


  const changeType =
    document.getElementById(
      "changeType"
    )?.value;


  const message =
    document.getElementById(
      "changeMessage"
    )?.value.trim();


  const attachmentInput =
    document.getElementById(
      "changeAttachment"
    );


  const attachment =
    attachmentInput?.files?.[0] || null;


  if (
    !requester ||
    !email ||
    !changeType ||
    !message
  ) {

    if (status) {

      status.textContent =
        "Please complete all required fields.";

      status.className =
        "profile-v2-form-status error";

    }

    return;

  }


  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  const maxSize =
    5 * 1024 * 1024;


  if (attachment) {

    if (!allowedTypes.includes(attachment.type)) {

      if (status) {
        status.textContent =
          "Please select a PDF, JPG or PNG file.";
        status.className =
          "profile-v2-form-status error";
      }

      return;
    }


    if (attachment.size > maxSize) {

      if (status) {
        status.textContent =
          "The attachment must be 5 MB or smaller.";
        status.className =
          "profile-v2-form-status error";
      }

      return;
    }
  }


  if (status) {

    status.textContent =
      attachment
        ? "Uploading supporting document..."
        : "Submitting request...";

    status.className =
      "profile-v2-form-status";

  }


  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      attachment
        ? "Uploading..."
        : "Submitting...";

  }


  try {

    const uploadedAttachment =
      await uploadChangeRequestAttachment(
        attachment,
        a.animalId || a.id
      );


    if (status) {

      status.textContent =
        "Submitting request...";

    }


    /* ========================================================
       SAVE REQUEST TO SUPABASE
       This powers the Admin Center notification/list.
       ======================================================== */

    const {
      error: changeRequestError
    } = await supabaseClient
      .from("change_requests")
      .insert({

        animal_id:
          a.animalId,

        animal_uuid:
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(a.id || "")
  )
    ? a.id
    : null,

        animal_name:
          a.name,

        requester_name:
          requester,

        requester_email:
          email,

        change_type:
          changeType,

        message:
          message,

        attachment_name:
          uploadedAttachment?.name ||
          "",

        attachment_type:
          uploadedAttachment?.type ||
          "",

        attachment_size:
          uploadedAttachment?.size ||
          0,

        attachment_path:
          uploadedAttachment?.path ||
          "",

        attachment_storage:
          uploadedAttachment
            ? "Supabase Storage / change-request-attachments"
            : "None",

        status:
          "PENDING"

      });


    if (changeRequestError) {

      console.error(
        "Supabase change request save failed:",
        changeRequestError
      );

      throw new Error(
        "The request could not be saved to the Admin Center. Please try again."
      );

    }


    const response =
      await fetch(
        "https://formspree.io/f/xrpgegka",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json"
          },

          body:
            JSON.stringify({

              animal_name:
                a.name,

              animal_id:
                a.animalId,

              animal_uuid:
                a.id,

              requester_name:
                requester,

              requester_email:
                email,

              change_type:
                changeType,

              message:
                message,

              attachment_name:
                uploadedAttachment?.name ||
                "No attachment",

              attachment_type:
                uploadedAttachment?.type ||
                "",

              attachment_size:
                uploadedAttachment?.size ||
                0,

              attachment_path:
                uploadedAttachment?.path ||
                "",

              attachment_storage:
                uploadedAttachment
                  ? "Supabase Storage / change-request-attachments"
                  : "None",

              source:
                "Animal Digital ID Profile"

            })

        }
      );


    if (
      response.ok
    ) {

      if (status) {

        status.textContent =
          uploadedAttachment
            ? "Your change request and supporting document have been submitted successfully."
            : "Your change request has been submitted successfully.";

        status.className =
          "profile-v2-form-status success";

      }


      form.reset();

      const nameBox =
        document.getElementById(
          "changeAttachmentName"
        );

      if (nameBox) {
        nameBox.style.display = "none";
        nameBox.textContent = "";
      }


      setTimeout(
        () => {

          closeProfileModal();

        },
        2200
      );

    }

    else {

      let errorMessage =
        "Unable to submit the request.";

      try {

        const result =
          await response.json();

        if (
          result?.errors?.length
        ) {

          errorMessage =
            result.errors
              .map(
                error =>
                  error.message
              )
              .join(" ");

        }

      }

      catch (
        ignored
      ) {
        /* Keep default error message */
      }


      throw new Error(
        errorMessage
      );

    }

  }

  catch (error) {

    console.error(
      "Change request submission failed:",
      error
    );


    if (status) {

      status.textContent =
        error.message ||
        "Unable to submit the request. Please try again.";

      status.className =
        "profile-v2-form-status error";

    }


    if (submitButton) {

      submitButton.disabled =
        false;

      submitButton.textContent =
        "Submit Request";

    }

  }

}

/* ============================================================
   INITIALIZE PROFILE
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    loadAnimalFromSupabase();

  }
);


/* ============================================================
   GLOBAL ERROR HANDLING
   ============================================================ */

window.addEventListener(
  "error",
  function (event) {

    console.error(
      "Profile page error:",
      event.error ||
      event.message
    );

  }
);


/* ============================================================
   UNHANDLED PROMISE ERROR
   ============================================================ */

window.addEventListener(
  "unhandledrejection",
  function (event) {

    console.error(
      "Profile page promise error:",
      event.reason
    );

  }
);


/* ============================================================
   PROFILE.JS COMPLETE
   ============================================================ */
