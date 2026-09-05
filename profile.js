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
      behaviour?.temperament ||
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

        if (
          Array.isArray(
            vaccination
          )
        ) {

          return vaccination;

        }

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

        if (
          Array.isArray(
            record
          )
        ) {

          return {

            weight:
              record[0],

            unit:
              record[1] ||
              "kg",

            date:
              record[2],

            notes:
              record[3] ||
              ""

          };

        }

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

    await loadSupabaseLibrary();

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );

    const profileId =
      getProfileId();

  if (!profileId) {

    showProfileError(
      "No animal profile ID was provided."
    );

    return;

  }


  try {

    let animal = null;


    /* ========================================================
       FIRST TRY UUID
       ======================================================== */

    let result =
      await supabaseClient
        .from("animals")
        .select(`
          *,
          owners (
            name,
            phone,
            alternate_phone
          ),
          behaviour_traits (
            temperament,
            traits,
            notes
          ),
          vaccinations (
            id,
            vaccine_name,
            vaccination_date,
            next_due_date,
            status
          ),
          weight_history (
            id,
            recorded_date,
            weight,
            unit,
            notes
          )
        `)
        .eq(
          "id",
          profileId
        )
        .maybeSingle();


    if (
      result.error
    ) {

      console.error(
        "UUID profile lookup error:",
        result.error
      );

    }


    animal =
      result.data ||
      null;


    /* ========================================================
       SECOND TRY ANIMAL ID
       ======================================================== */

    if (!animal) {

      result =
        await supabaseClient
          .from("animals")
          .select(`
            *,
            owners (
              name,
              phone,
              alternate_phone
            ),
            behaviour_traits (
              temperament,
              traits,
              notes
            ),
            vaccinations (
              id,
              vaccine_name,
              vaccination_date,
              next_due_date,
              status
            ),
            weight_history (
              id,
              recorded_date,
              weight,
              unit,
              notes
            )
          `)
          .eq(
            "animal_id",
            profileId
          )
          .maybeSingle();


      if (
        result.error
      ) {

        console.error(
          "Animal ID profile lookup error:",
          result.error
        );

      }


      animal =
        result.data ||
        null;

    }


    /* ========================================================
       HANDLE NOT FOUND
       ======================================================== */

    if (!animal) {

      showProfileError(
        "The requested animal profile could not be found."
      );

      return;

    }


    /* ========================================================
       NORMALIZE
       ======================================================== */

    currentAnimal =
      normalizeAnimal(
        animal
      );


    /* ========================================================
       RENDER
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
      ? weights[0]
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
    `${location.origin}${location.pathname}?id=${encodeURIComponent(a.id)}`;


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


          <nav class="nav">

            <a href="./index.html">
              Home
            </a>

          </nav>

        </header>


        <main class="content profile-v2-content">


          <!-- ==================================================
               ACTION BAR
          ================================================== -->

          <div class="profile-v2-topbar">

            <a
              href="./index.html"
              class="profile-v2-back">

              ← Back to Registry

            </a>


            <button
              type="button"
              class="profile-v2-change"
              onclick="openChangeRequest()">

              📝 Request a Change

            </button>

          </div>


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

      Vaccination records associated with
      this animal profile.

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

      If any information in this animal profile
      needs to be corrected or updated, submit
      the request below.

    </p>


    <form
      id="profileChangeForm"
      class="profile-v2-change-form">


      <input
        type="hidden"
        name="animal_id"
        value="${esc(a.animalId)}">


      <input
        type="hidden"
        name="animal_name"
        value="${esc(a.name)}">


      <div
        class="profile-v2-form-group">

        <label
          for="changeName">

          Your Name

        </label>

        <input
          id="changeName"
          name="name"
          type="text"
          required
          placeholder="Enter your name">

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
          required
          placeholder="Enter your email">

      </div>


      <div
        class="profile-v2-form-group">

        <label
          for="changeType">

          What needs to be changed?

        </label>

        <select
          id="changeType"
          name="change_type"
          required>

          <option value="">
            Select an option
          </option>

          <option value="Identity">
            Identity Information
          </option>

          <option value="Contact">
            Owner / Contact Information
          </option>

          <option value="Behaviour">
            Behaviour Information
          </option>

          <option value="Health">
            Health Information
          </option>

          <option value="Location">
            Location
          </option>

          <option value="Photo">
            Profile Photo
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

          Details

        </label>

        <textarea
          id="changeMessage"
          name="message"
          rows="5"
          required
          placeholder="Describe the information that needs to be changed..."></textarea>

      </div>


      <div
        id="changeFormStatus"
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
          class="profile-v2-full-button">

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

async function submitChangeRequest(
  event
) {

  event.preventDefault();


  const form =
    event.currentTarget;


  const status =
    document.getElementById(
      "changeFormStatus"
    );


  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );


  if (submitButton) {

    submitButton.disabled =
      true;

    submitButton.textContent =
      "Submitting...";

  }


  if (status) {

    status.className =
      "profile-v2-form-status";

    status.textContent =
      "Submitting your request...";

  }


  try {

    const formData =
      new FormData(form);


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


    if (
      !response.ok
    ) {

      throw new Error(
        "Request could not be submitted."
      );

    }


    if (status) {

      status.className =
        "profile-v2-form-status success";

      status.textContent =
        "✓ Your change request has been submitted successfully.";

    }


    form.reset();


    if (submitButton) {

      submitButton.textContent =
        "Submitted ✓";

    }


  }
  catch (error) {

    console.error(
      "Change request failed:",
      error
    );


    if (status) {

      status.className =
        "profile-v2-form-status error";

      status.textContent =
        "Unable to submit the request. Please try again.";

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
   FINAL PROFILE.JS
   ============================================================ */
