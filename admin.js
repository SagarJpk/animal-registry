/* ============================================================
   ANIMAL DIGITAL ID
   ADMIN CENTER
   admin.js
   ============================================================ */


/* ============================================================
   SUPABASE CONFIGURATION
   ============================================================ */

const SUPABASE_URL =
  "https://qnlatfajpbyefxyyehna.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_w9-d4xchiCpeOnKRas_u2Q_wrFVPOwf";


const {
  createClient
} = window.supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* ============================================================
   DOM
   ============================================================ */

const loginScreen =
  document.getElementById("loginScreen");

const adminApp =
  document.getElementById("adminApp");

const loginForm =
  document.getElementById("loginForm");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const loginButton =
  document.getElementById("loginButton");

const loginMessage =
  document.getElementById("loginMessage");

const logoutButton =
  document.getElementById("logoutButton");

const adminUserName =
  document.getElementById("adminUserName");

const adminUserEmail =
  document.getElementById("adminUserEmail");

const totalAnimals =
  document.getElementById("totalAnimals");

const activeAnimals =
  document.getElementById("activeAnimals");

const lostAnimals =
  document.getElementById("lostAnimals");

const changeRequests =
  document.getElementById("changeRequests");

const animalList =
  document.getElementById("animalList");

const animalSearch =
  document.getElementById("animalSearch");

const loading =
  document.getElementById("loading");

const addAnimalButton =
  document.getElementById("addAnimalButton");

const emptyAddAnimalButton =
  document.getElementById("emptyAddAnimalButton");


/* ============================================================
   STATE
   ============================================================ */

let currentUser = null;
let currentAdmin = null;
let animalsCache = [];

let editingAnimalId = null;

/* PHOTO UPLOAD STATE */
let selectedPhotoFile = null;
let currentPhotoUrl = "";


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


/* ============================================================
   LOGIN MESSAGES
   ============================================================ */

function showLoginMessage(
  message,
  type = "error"
) {

  loginMessage.textContent =
    message;

  loginMessage.style.color =
    type === "success"
      ? "#2d8a62"
      : "#b84c4c";
}


function clearLoginMessage() {

  loginMessage.textContent = "";
}


/* ============================================================
   LOGIN BUTTON
   ============================================================ */

function setLoginLoading(
  isLoading
) {

  loginButton.disabled =
    isLoading;

  loginButton.textContent =
    isLoading
      ? "SIGNING IN..."
      : "SIGN IN";
}


/* ============================================================
   SHOW / HIDE APP
   ============================================================ */

function showLogin() {

  loginScreen.style.display =
    "flex";

  adminApp.style.display =
    "none";
}


function showAdminApp() {

  loginScreen.style.display =
    "none";

  adminApp.style.display =
    "block";
}


/* ============================================================
   ADMIN PROFILE
   ============================================================ */

async function getAdminProfile(
  userId
) {

  const {
    data,
    error
  } = await supabaseClient
    .from("admin_users")
    .select(
      "id,email,full_name,role,is_active"
    )
    .eq("id", userId)
    .maybeSingle();


  if (error) {

    console.error(
      "Admin profile error:",
      error
    );

    throw new Error(
      "Unable to verify administrator permissions."
    );
  }


  if (!data) {

    throw new Error(
      "Your account is not registered as an Animal Digital ID administrator."
    );
  }


  if (!data.is_active) {

    throw new Error(
      "Your administrator account is inactive."
    );
  }


  if (
    data.role !== "ADMIN" &&
    data.role !== "SUPER_ADMIN"
  ) {

    throw new Error(
      "Your account does not have administrator permissions."
    );
  }


  return data;
}


/* ============================================================
   LOGIN
   ============================================================ */

async function login(
  email,
  password
) {

  clearLoginMessage();

  setLoginLoading(true);


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password
      });


    if (error) {

      console.error(
        "Login error:",
        error
      );

      throw new Error(
        "Invalid email or password."
      );
    }


    if (!data.user) {

      throw new Error(
        "Login was not completed."
      );
    }


    currentUser =
      data.user;


    currentAdmin =
      await getAdminProfile(
        currentUser.id
      );


    updateAdminHeader();

    showAdminApp();

    await loadDashboard();


  } catch (error) {

    console.error(
      "Login failed:",
      error
    );


    if (
      currentUser &&
      !currentAdmin
    ) {

      await supabaseClient.auth.signOut();

      currentUser = null;
    }


    showLoginMessage(
      error.message ||
      "Unable to sign in."
    );


  } finally {

    setLoginLoading(false);
  }
}


/* ============================================================
   HEADER
   ============================================================ */

function updateAdminHeader() {

  adminUserName.textContent =
    currentAdmin?.full_name ||
    "Administrator";


  adminUserEmail.textContent =
    currentAdmin?.email ||
    currentUser?.email ||
    "—";
}


/* ============================================================
   LOGOUT
   ============================================================ */

async function logout() {

  try {

    await supabaseClient.auth.signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  } finally {

    currentUser = null;
    currentAdmin = null;
    animalsCache = [];
    editingAnimalId = null;

    showLogin();

    passwordInput.value = "";

    clearLoginMessage();

    animalList.innerHTML = "";

    totalAnimals.textContent = "0";
    activeAnimals.textContent = "0";
    lostAnimals.textContent = "0";
    changeRequests.textContent = "0";
  }
}


/* ============================================================
   DASHBOARD
   ============================================================ */

async function loadDashboard() {

  setLoading(true);

  try {

    await Promise.all([
      loadAnimals(),
      loadChangeRequests()
    ]);

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    animalList.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h4>
          Unable to load registry
        </h4>

        <p>
          ${escapeHtml(error.message)}
        </p>

      </div>
    `;
  }

  setLoading(false);
}


/* ============================================================
   LOAD ANIMALS
   ============================================================ */

async function loadAnimals() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("animals")
      .select(`
        id,
        animal_id,
        name,
        type,
        breed,
        gender,
        date_of_birth,
        colour,
        markings,
        microchip_number,
        microchip_provider,
        identification_notes,
        government_reference,
        photo_url,
        owner_id,
        location_city,
        location_state,
        location_country,
        map_url,
        status,
        is_public,
        is_lost,
        special_instructions,
        notes,
        registration_date,
        created_at,
        updated_at
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.error(
      "Animal loading error:",
      error
    );

    throw new Error(
      error.message
    );
  }


  animalsCache =
    data || [];


  updateAnimalStats(
    animalsCache
  );


  renderAnimals(
    animalsCache
  );
}


/* ============================================================
   STATISTICS
   ============================================================ */

function updateAnimalStats(
  animals
) {

  totalAnimals.textContent =
    animals.length;


  activeAnimals.textContent =
    animals.filter(
      animal =>
        animal.status ===
        "ACTIVE RECORD"
    ).length;


  lostAnimals.textContent =
    animals.filter(
      animal =>
        animal.is_lost === true
    ).length;
}


/* ============================================================
   CHANGE REQUESTS
   ============================================================ */

async function loadChangeRequests() {

  const {
    count,
    error
  } =
    await supabaseClient
      .from("change_requests")
      .select(
        "id",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "status",
        "PENDING"
      );


  if (error) {

    console.error(
      "Change request error:",
      error
    );

    changeRequests.textContent =
      "0";

    return;
  }


  changeRequests.textContent =
    count || 0;
}


/* ============================================================
   SEARCH
   ============================================================ */

function searchAnimals(
  query
) {

  const q =
    query
      .trim()
      .toLowerCase();


  if (!q) {

    renderAnimals(
      animalsCache
    );

    return;
  }


  const filtered =
    animalsCache.filter(
      animal => {

        const searchable = [

          animal.name,
          animal.animal_id,
          animal.type,
          animal.breed,
          animal.gender,
          animal.status,
          animal.location_city,
          animal.location_state,
          animal.location_country

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        return searchable.includes(q);
      }
    );


  renderAnimals(
    filtered
  );
}


/* ============================================================
   RENDER REGISTRY
   ============================================================ */

function renderAnimals(
  animals
) {

  if (!animals.length) {

    animalList.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          🐾
        </div>

        <h4>
          No animals found
        </h4>

        <p>
          There are currently no animal records
          matching your search.
        </p>

      </div>
    `;

    return;
  }


  animalList.innerHTML = `

    <div
      style="
        display:grid;
        gap:12px;
      "
    >

      ${
        animals
          .map(
            animal =>
              renderAnimalCard(animal)
          )
          .join("")
      }

    </div>
  `;
}


/* ============================================================
   ANIMAL CARD
   ============================================================ */

function renderAnimalCard(
  animal
) {

  const photo =
    animal.photo_url || "";


  const location = [
    animal.location_city,
    animal.location_state
  ]
    .filter(Boolean)
    .join(", ");


  return `

    <div
      style="
        display:grid;
        grid-template-columns:80px minmax(0,1fr) auto;
        gap:14px;
        align-items:center;
        padding:12px;
        border-radius:17px;
        background:var(--surface);
        box-shadow:var(--shadow-soft);
      "
    >

      <div
        style="
          width:80px;
          height:90px;
          overflow:hidden;
          border-radius:13px;
          background:#dce4e9;
          box-shadow:var(--shadow-inset);
        "
      >

        ${
          photo
            ? `
              <img
                src="${escapeHtml(photo)}"
                alt="${escapeHtml(animal.name)}"
                style="
                  width:100%;
                  height:100%;
                  display:block;
                  object-fit:cover;
                "
              >
            `
            : `
              <div
                style="
                  width:100%;
                  height:100%;
                  display:grid;
                  place-items:center;
                  font-size:28px;
                "
              >
                🐾
              </div>
            `
        }

      </div>


      <div style="min-width:0">

        <div
          style="
            display:flex;
            align-items:center;
            gap:8px;
            flex-wrap:wrap;
          "
        >

          <strong
            style="
              color:var(--navy);
              font-size:14px;
            "
          >
            ${escapeHtml(animal.name)}
          </strong>


          <span
            style="
              display:inline-flex;
              padding:4px 8px;
              border-radius:999px;
              background:rgba(45,138,98,.12);
              color:#287651;
              font-size:8px;
              font-weight:800;
            "
          >
            ${escapeHtml(animal.status)}
          </span>


          ${
            animal.is_lost
              ? `
                <span
                  style="
                    padding:4px 8px;
                    border-radius:999px;
                    background:rgba(184,76,76,.14);
                    color:#a64040;
                    font-size:8px;
                    font-weight:800;
                  "
                >
                  LOST
                </span>
              `
              : ""
          }

        </div>


        <div
          style="
            margin-top:4px;
            color:var(--muted);
            font-size:10px;
            font-weight:700;
          "
        >
          ${escapeHtml(animal.animal_id)}
        </div>


        <div
          style="
            margin-top:7px;
            display:flex;
            gap:12px;
            flex-wrap:wrap;
            color:var(--muted);
            font-size:9px;
          "
        >

          <span>
            ${escapeHtml(animal.type || "—")}
          </span>

          <span>
            ${escapeHtml(animal.breed || "—")}
          </span>

          <span>
            ${escapeHtml(location || "Location not added")}
          </span>

        </div>

      </div>


      <div>

        <button
          type="button"
          onclick="openAnimalEditor('${animal.id}')"
          style="
            border:0;
            border-radius:11px;
            padding:9px 13px;
            background:var(--surface);
            color:var(--navy);
            box-shadow:var(--shadow-soft);
            font-size:9px;
            font-weight:800;
          "
        >
          EDIT
        </button>

      </div>

    </div>
  `;
}


/* ============================================================
   LOADING
   ============================================================ */

function setLoading(
  isLoading
) {

  loading.style.display =
    isLoading
      ? "block"
      : "none";
}


/* ============================================================
   EDITOR STYLES
   ============================================================ */

function addEditorStyles() {

  if (
    document.getElementById(
      "animalEditorStyles"
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "animalEditorStyles";


  style.textContent = `

    .animal-modal {
      position:fixed;
      inset:0;
      z-index:9999;
      display:none;
      align-items:center;
      justify-content:center;
      padding:20px;
      background:rgba(8,36,63,.45);
      backdrop-filter:blur(8px);
    }

    .animal-modal.open {
      display:flex;
    }

    .animal-modal-card {
      width:100%;
      max-width:1050px;
      max-height:92vh;
      overflow:auto;
      border-radius:26px;
      background:var(--surface);
      box-shadow:
        16px 16px 35px rgba(20,35,48,.30),
        -10px -10px 25px rgba(255,255,255,.85);
    }

    .animal-modal-header {
      position:sticky;
      top:0;
      z-index:3;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:15px;
      padding:20px 24px;
      color:#fff;
      background:
        linear-gradient(
          135deg,
          #173d5d,
          #245579
        );
    }

    .animal-modal-header h2 {
      margin:0;
      font-size:17px;
    }

    .animal-modal-header p {
      margin:4px 0 0;
      font-size:9px;
      opacity:.75;
    }

    .modal-close {
      width:36px;
      height:36px;
      border:0;
      border-radius:12px;
      color:#fff;
      background:rgba(255,255,255,.12);
      font-size:20px;
    }

    .animal-editor-body {
      padding:22px;
    }

    .editor-section {
      margin-bottom:20px;
      padding:18px;
      border-radius:19px;
      background:var(--surface);
      box-shadow:var(--shadow-soft);
    }

    .editor-section h3 {
      margin:0 0 14px;
      color:var(--navy);
      font-size:13px;
    }

    .editor-grid {
      display:grid;
      grid-template-columns:
        repeat(3,minmax(0,1fr));
      gap:13px;
    }

    .editor-field {
      min-width:0;
    }

    .editor-field.full {
      grid-column:1/-1;
    }

    .editor-field label {
      display:block;
      margin:0 0 6px 3px;
      color:var(--muted);
      font-size:9px;
      font-weight:700;
    }

    .editor-field input,
    .editor-field select,
    .editor-field textarea {
      width:100%;
      border:0;
      outline:0;
      border-radius:11px;
      padding:10px 11px;
      color:var(--text);
      background:var(--surface);
      box-shadow:var(--shadow-inset);
      font-size:10px;
    }

    .editor-field textarea {
      min-height:70px;
      resize:vertical;
    }

    .photo-upload-box {
      padding:12px;
      border-radius:14px;
      background:rgba(255,255,255,.25);
      box-shadow:var(--shadow-inset);
    }

    .photo-upload-button {
      width:100%;
      border:0;
      border-radius:11px;
      padding:11px 13px;
      color:#fff;
      background:
        linear-gradient(
          135deg,
          #245579,
          #173d5d
        );
      box-shadow:var(--shadow-soft);
      font-size:10px;
      font-weight:800;
      cursor:pointer;
    }

    .photo-upload-button:hover {
      transform:translateY(-1px);
    }

    .photo-upload-help {
      margin-top:7px;
      text-align:center;
      color:var(--muted);
      font-size:8px;
    }

    .photo-preview {
      margin-top:10px;
      width:100%;
      min-height:120px;
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
      border-radius:12px;
      background:#dce4e9;
      box-shadow:var(--shadow-inset);
    }

    .photo-preview img {
      display:block;
      width:100%;
      max-height:180px;
      object-fit:cover;
      border-radius:10px;
    }

    .photo-preview-empty {
      padding:25px 10px;
      color:var(--muted);
      font-size:10px;
      text-align:center;
    }

    .photo-upload-status {
      margin-top:7px;
      min-height:16px;
      font-size:9px;
      font-weight:700;
      text-align:center;
    }

    .editor-checks {
      display:flex;
      flex-wrap:wrap;
      gap:10px;
    }

    .editor-check {
      display:flex;
      align-items:center;
      gap:7px;
      padding:9px 11px;
      border-radius:11px;
      background:var(--surface);
      box-shadow:var(--shadow-soft);
      font-size:9px;
      color:var(--text);
    }

    .editor-check input {
      accent-color:#245579;
    }

    .repeat-row {
      display:grid;
      grid-template-columns:
        1.2fr 1fr 1fr 1fr;
      gap:9px;
      margin-bottom:9px;
      padding:11px;
      border-radius:13px;
      background:rgba(255,255,255,.25);
      box-shadow:var(--shadow-inset);
    }

    .repeat-row input,
    .repeat-row select {
      width:100%;
      border:0;
      outline:0;
      border-radius:9px;
      padding:8px;
      background:var(--surface);
      box-shadow:var(--shadow-soft);
      font-size:9px;
    }

    .repeat-remove {
      border:0;
      border-radius:9px;
      color:#a64040;
      background:rgba(184,76,76,.10);
      font-size:9px;
      font-weight:800;
    }

    .editor-add {
      border:0;
      border-radius:10px;
      padding:9px 12px;
      color:var(--navy);
      background:var(--surface);
      box-shadow:var(--shadow-soft);
      font-size:9px;
      font-weight:800;
    }

    .editor-footer {
      position:sticky;
      bottom:0;
      z-index:3;
      display:flex;
      justify-content:flex-end;
      gap:10px;
      padding:15px 22px;
      background:rgba(232,237,241,.94);
      backdrop-filter:blur(8px);
    }

    .editor-cancel,
    .editor-save {
      border:0;
      border-radius:12px;
      padding:11px 17px;
      font-size:10px;
      font-weight:800;
    }

    .editor-cancel {
      color:var(--navy);
      background:var(--surface);
      box-shadow:var(--shadow-soft);
    }

    .editor-save {
      color:#fff;
      background:
        linear-gradient(
          135deg,
          #245579,
          #173d5d
        );
      box-shadow:var(--shadow-soft);
    }

    .editor-save:disabled {
      opacity:.6;
    }

    .editor-message {
      margin-right:auto;
      align-self:center;
      color:#b84c4c;
      font-size:10px;
      font-weight:700;
    }

    @media(max-width:800px) {

      .editor-grid {
        grid-template-columns:
          repeat(2,minmax(0,1fr));
      }

      .repeat-row {
        grid-template-columns:
          repeat(2,minmax(0,1fr));
      }
    }

    @media(max-width:560px) {

      .animal-modal {
        padding:8px;
      }

      .animal-modal-card {
        max-height:96vh;
        border-radius:19px;
      }

      .animal-modal-header {
        padding:15px;
      }

      .animal-editor-body {
        padding:13px;
      }

      .editor-section {
        padding:13px;
      }

      .editor-grid {
        grid-template-columns:1fr;
      }

      .repeat-row {
        grid-template-columns:1fr;
      }

      .editor-footer {
        padding:12px;
      }
    }
  `;


  document.head.appendChild(
    style
  );
}


/* ============================================================
   CREATE EDITOR MODAL
   ============================================================ */

function createEditorModal() {

  if (
    document.getElementById(
      "animalEditorModal"
    )
  ) {
    return;
  }


  addEditorStyles();


  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "animalEditorModal";


  modal.className =
    "animal-modal";


  modal.innerHTML = `

    <div class="animal-modal-card">

      <div class="animal-modal-header">

        <div>

          <h2 id="editorTitle">
            Add Animal
          </h2>

          <p>
            Animal Digital ID Registry
          </p>

        </div>

        <button
          id="modalClose"
          class="modal-close"
          type="button"
        >
          ×
        </button>

      </div>


      <form
        id="animalEditorForm"
        class="animal-editor-body"
      >


        <!-- IDENTITY -->

        <section class="editor-section">

          <h3>
            🐾 Animal Identity
          </h3>

          <div class="editor-grid">

            <div class="editor-field">

              <label>
                Animal ID *
              </label>

              <input
                id="f_animal_id"
                required
                placeholder="ANM-KA-2026-000001"
              >

            </div>


            <div class="editor-field">

              <label>
                Name *
              </label>

              <input
                id="f_name"
                required
                placeholder="Animal name"
              >

            </div>


            <div class="editor-field">

              <label>
                Type *
              </label>

              <input
                id="f_type"
                required
                placeholder="Dog / Cat / Cow..."
              >

            </div>


            <div class="editor-field">

              <label>
                Breed
              </label>

              <input
                id="f_breed"
                placeholder="Breed"
              >

            </div>


            <div class="editor-field">

              <label>
                Gender
              </label>

              <select id="f_gender">

                <option value="">
                  Select
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Unknown">
                  Unknown
                </option>

              </select>

            </div>


            <div class="editor-field">

              <label>
                Date of Birth
              </label>

              <input
                id="f_dob"
                type="date"
              >

            </div>


            <div class="editor-field">

              <label>
                Colour
              </label>

              <input
                id="f_colour"
                placeholder="Colour"
              >

            </div>


            <div class="editor-field">

              <label>
                Markings
              </label>

              <input
                id="f_markings"
                placeholder="Identifying markings"
              >

            </div>


            <div class="editor-field">

  <label>
    Animal Photo
  </label>

  <div class="photo-upload-box">

    <input
      id="f_photo_file"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      style="display:none"
    >

    <button
      id="photoUploadButton"
      type="button"
      class="photo-upload-button"
    >
      📷 Choose Photo from Laptop
    </button>

    <div class="photo-upload-help">
      JPG, PNG or WebP • Maximum 5 MB
    </div>

    <div
      id="photoPreview"
      class="photo-preview"
    >
      <div class="photo-preview-empty">
        🐾 No photo selected
      </div>
    </div>

    <div
      id="photoUploadStatus"
      class="photo-upload-status"
    ></div>

  </div>

  <input
    id="f_photo"
    type="hidden"
  >

</div>

            <div class="editor-field">

              <label>
                Microchip Number
              </label>

              <input
                id="f_microchip"
              >

            </div>


            <div class="editor-field">

              <label>
                Microchip Provider
              </label>

              <input
                id="f_microchip_provider"
              >

            </div>


            <div class="editor-field">

              <label>
                Government Reference
              </label>

              <input
                id="f_government_reference"
              >

            </div>


            <div class="editor-field full">

              <label>
                Identification Notes
              </label>

              <textarea
                id="f_identification_notes"
              ></textarea>

            </div>

          </div>

        </section>


        <!-- OWNER -->

        <section class="editor-section">

          <h3>
            👤 Owner
          </h3>

          <div class="editor-grid">

            <div class="editor-field">

              <label>
                Owner Name
              </label>

              <input
                id="f_owner_name"
              >

            </div>


            <div class="editor-field">

              <label>
                Phone
              </label>

              <input
                id="f_owner_phone"
                type="tel"
              >

            </div>


            <div class="editor-field">

              <label>
                Alternate Phone
              </label>

              <input
                id="f_owner_alt"
                type="tel"
              >

            </div>


            <div class="editor-field">

              <label>
                Email
              </label>

              <input
                id="f_owner_email"
                type="email"
              >

            </div>


            <div class="editor-field">

              <label>
                City
              </label>

              <input
                id="f_owner_city"
              >

            </div>


            <div class="editor-field">

              <label>
                State
              </label>

              <input
                id="f_owner_state"
              >

            </div>


            <div class="editor-field">

              <label>
                Country
              </label>

              <input
                id="f_owner_country"
                value="India"
              >

            </div>


            <div class="editor-field">

              <label>
                Postal Code
              </label>

              <input
                id="f_owner_postal"
              >

            </div>


            <div class="editor-field">

              <label>
                Emergency Contact
              </label>

              <input
                id="f_emergency_name"
              >

            </div>


            <div class="editor-field">

              <label>
                Emergency Phone
              </label>

              <input
                id="f_emergency_phone"
                type="tel"
              >

            </div>

          </div>

        </section>


        <!-- LOCATION -->

        <section class="editor-section">

          <h3>
            📍 Location
          </h3>

          <div class="editor-grid">

            <div class="editor-field">

              <label>
                City
              </label>

              <input
                id="f_location_city"
              >

            </div>


            <div class="editor-field">

              <label>
                State
              </label>

              <input
                id="f_location_state"
              >

            </div>


            <div class="editor-field">

              <label>
                Country
              </label>

              <input
                id="f_location_country"
                value="India"
              >

            </div>


            <div class="editor-field full">

              <label>
                Google Maps URL
              </label>

              <input
                id="f_map_url"
                type="url"
                placeholder="https://maps.google.com/..."
              >

            </div>

          </div>

        </section>


        <!-- BEHAVIOUR -->

        <section class="editor-section">

          <h3>
            🧠 Behaviour & Temperament
          </h3>

          <div class="editor-grid">

            <div class="editor-field">

              <label>
                Temperament
              </label>

              <input
                id="f_temperament"
                placeholder="Friendly / Cautious..."
              >

            </div>


            <div class="editor-field">

              <label>
                Energy Level
              </label>

              <select id="f_energy">

                <option value="">
                  Select
                </option>

                <option value="Low">
                  Low
                </option>

                <option value="Moderate">
                  Moderate
                </option>

                <option value="High">
                  High
                </option>

              </select>

            </div>


            <div class="editor-field">

              <label>
                Stranger Friendliness
              </label>

              <input
                id="f_stranger"
              >

            </div>


            <div class="editor-field">

              <label>
                Leash Behaviour
              </label>

              <input
                id="f_leash"
              >

            </div>


            <div class="editor-field">

              <label>
                Handling Behaviour
              </label>

              <input
                id="f_handling"
              >

            </div>


            <div class="editor-field">

              <label>
                Food Preferences
              </label>

              <input
                id="f_food"
              >

            </div>


            <div class="editor-field full">

              <div class="editor-checks">

                <label class="editor-check">
                  <input
                    id="f_children"
                    type="checkbox"
                  >
                  Good with children
                </label>


                <label class="editor-check">
                  <input
                    id="f_dogs"
                    type="checkbox"
                  >
                  Good with dogs
                </label>


                <label class="editor-check">
                  <input
                    id="f_cats"
                    type="checkbox"
                  >
                  Good with cats
                </label>

              </div>

            </div>


            <div class="editor-field full">

              <label>
                Behaviour Special Instructions
              </label>

              <textarea
                id="f_behaviour_instructions"
              ></textarea>

            </div>

          </div>

        </section>


        <!-- VACCINATIONS -->

        <section class="editor-section">

          <h3>
            💉 Vaccinations
          </h3>

          <div id="vaccinationRows"></div>

          <button
            id="addVaccination"
            class="editor-add"
            type="button"
          >
            ＋ Add Vaccination
          </button>

        </section>


        <!-- MEDICAL -->

        <section class="editor-section">

          <h3>
            🏥 Medical Records
          </h3>

          <div id="medicalRows"></div>

          <button
            id="addMedical"
            class="editor-add"
            type="button"
          >
            ＋ Add Medical Record
          </button>

        </section>


        <!-- WEIGHT -->

        <section class="editor-section">

          <h3>
            ⚖️ Weight History
          </h3>

          <div id="weightRows"></div>

          <button
            id="addWeight"
            class="editor-add"
            type="button"
          >
            ＋ Add Weight Record
          </button>

        </section>


        <!-- REGISTRY -->

        <section class="editor-section">

          <h3>
            ⚙️ Registry Settings
          </h3>

          <div class="editor-grid">

            <div class="editor-field">

              <label>
                Status
              </label>

              <select id="f_status">

                <option value="ACTIVE RECORD">
                  ACTIVE RECORD
                </option>

                <option value="INACTIVE">
                  INACTIVE
                </option>

                <option value="TRANSFERRED">
                  TRANSFERRED
                </option>

                <option value="DECEASED">
                  DECEASED
                </option>

                <option value="ARCHIVED">
                  ARCHIVED
                </option>

              </select>

            </div>


            <div class="editor-field">

              <label>
                Registration Date
              </label>

              <input
                id="f_registration_date"
                type="date"
              >

            </div>


            <div class="editor-field">

              <label>
                Visibility
              </label>

              <div class="editor-checks">

                <label class="editor-check">

                  <input
                    id="f_public"
                    type="checkbox"
                    checked
                  >

                  Public Profile

                </label>


                <label class="editor-check">

                  <input
                    id="f_lost"
                    type="checkbox"
                  >

                  Lost Mode

                </label>

              </div>

            </div>


            <div class="editor-field full">

              <label>
                Special Instructions
              </label>

              <textarea
                id="f_special"
              ></textarea>

            </div>


            <div class="editor-field full">

              <label>
                Internal Notes
              </label>

              <textarea
                id="f_notes"
              ></textarea>

            </div>

          </div>

        </section>

      </form>


      <div class="editor-footer">

        <div
          id="editorMessage"
          class="editor-message"
        ></div>

        <button
          id="editorCancel"
          class="editor-cancel"
          type="button"
        >
          Cancel
        </button>

        <button
          id="editorSave"
          class="editor-save"
          type="button"
        >
          SAVE ANIMAL
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(
    modal
  );


  document
    .getElementById("modalClose")
    .addEventListener(
      "click",
      closeAnimalEditor
    );


  document
    .getElementById("editorCancel")
    .addEventListener(
      "click",
      closeAnimalEditor
    );


  document
    .getElementById("editorSave")
    .addEventListener(
      "click",
      saveAnimal
    );


  document
    .getElementById("addVaccination")
    .addEventListener(
      "click",
      () =>
        addVaccinationRow()
    );


  document
    .getElementById("addMedical")
    .addEventListener(
      "click",
      () =>
        addMedicalRow()
    );


  document
    .getElementById("addWeight")
    .addEventListener(
      "click",
      () =>
        addWeightRow()
    );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {
        closeAnimalEditor();
      }
    }
  );
}

/* ============================================================
   PHOTO UPLOAD
   ============================================================ */

document
  .getElementById("photoUploadButton")
  .addEventListener(
    "click",
    () => {
      document
        .getElementById("f_photo_file")
        .click();
    }
  );


document
  .getElementById("f_photo_file")
  .addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];

      const status =
        document.getElementById(
          "photoUploadStatus"
        );

      const preview =
        document.getElementById(
          "photoPreview"
        );


      status.textContent = "";
      status.style.color = "#b84c4c";


      if (!file) {
        selectedPhotoFile = null;
        return;
      }


      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        status.textContent =
          "Please select JPG, PNG or WebP.";

        event.target.value = "";

        selectedPhotoFile = null;

        return;
      }


      const maxSize =
        5 * 1024 * 1024;


      if (
        file.size > maxSize
      ) {

        status.textContent =
          "Photo must be 5 MB or smaller.";

        event.target.value = "";

        selectedPhotoFile = null;

        return;
      }


      selectedPhotoFile =
        file;


      const reader =
        new FileReader();


      reader.onload = event => {

        preview.innerHTML = `
          <img
            src="${event.target.result}"
            alt="Selected animal photo"
          >
        `;

        status.style.color =
          "#2d8a62";

        status.textContent =
          `✓ ${file.name} selected`;
      };


      reader.readAsDataURL(file);

    }
  );

/* ============================================================
   FIELD HELPER
   ============================================================ */

function setField(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return;
  }


  if (
    element.type ===
    "checkbox"
  ) {

    element.checked =
      Boolean(value);

    return;
  }


  element.value =
    value ?? "";
}


/* ============================================================
   GET FIELD
   ============================================================ */

function getField(
  id
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return "";
  }


  if (
    element.type ===
    "checkbox"
  ) {

    return element.checked;
  }


  return element.value.trim();
}


/* ============================================================
   ADD VACCINATION ROW
   ============================================================ */

function addVaccinationRow(
  record = null
) {

  const container =
    document.getElementById(
      "vaccinationRows"
    );


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "repeat-row vaccination-row";


  row.innerHTML = `

    <input
      data-field="vaccine"
      placeholder="Vaccine name"
      value="${escapeHtml(record?.vaccine_name || "")}"
    >

    <input
      data-field="date"
      type="date"
      value="${escapeHtml(record?.vaccination_date || "")}"
    >

    <input
      data-field="next"
      type="date"
      value="${escapeHtml(record?.next_due_date || "")}"
    >

    <input
      data-field="batch"
      placeholder="Batch / Lot"
      value="${escapeHtml(record?.batch_number || "")}"
    >

    <input
      data-field="manufacturer"
      placeholder="Manufacturer"
      value="${escapeHtml(record?.manufacturer || "")}"
    >

    <input
      data-field="clinic"
      placeholder="Clinic"
      value="${escapeHtml(record?.clinic_name || "")}"
    >

    <input
      data-field="vet"
      placeholder="Veterinarian"
      value="${escapeHtml(record?.veterinarian_name || "")}"
    >

    <select data-field="status">

      <option value="RECORDED"
        ${
          record?.status === "RECORDED"
            ? "selected"
            : ""
        }>
        RECORDED
      </option>

      <option value="LATEST"
        ${
          record?.status === "LATEST"
            ? "selected"
            : ""
        }>
        LATEST
      </option>

      <option value="EXPIRED"
        ${
          record?.status === "EXPIRED"
            ? "selected"
            : ""
        }>
        EXPIRED
      </option>

    </select>

    <button
      type="button"
      class="repeat-remove"
    >
      REMOVE
    </button>
  `;


  row
    .querySelector(
      ".repeat-remove"
    )
    .addEventListener(
      "click",
      () =>
        row.remove()
    );


  container.appendChild(
    row
  );
}


/* ============================================================
   ADD MEDICAL ROW
   ============================================================ */

function addMedicalRow(
  record = null
) {

  const container =
    document.getElementById(
      "medicalRows"
    );


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "repeat-row medical-row";


  row.style.gridTemplateColumns =
    "1fr 1fr 1fr 1fr";


  row.innerHTML = `

    <input
      data-field="date"
      type="date"
      value="${escapeHtml(record?.record_date || "")}"
    >

    <input
      data-field="type"
      placeholder="Record type"
      value="${escapeHtml(record?.record_type || "")}"
    >

    <input
      data-field="diagnosis"
      placeholder="Diagnosis"
      value="${escapeHtml(record?.diagnosis || "")}"
    >

    <input
      data-field="treatment"
      placeholder="Treatment"
      value="${escapeHtml(record?.treatment || "")}"
    >

    <input
      data-field="medication"
      placeholder="Medication"
      value="${escapeHtml(record?.medication || "")}"
    >

    <input
      data-field="clinic"
      placeholder="Clinic"
      value="${escapeHtml(record?.clinic_name || "")}"
    >

    <input
      data-field="vet"
      placeholder="Veterinarian"
      value="${escapeHtml(record?.veterinarian_name || "")}"
    >

    <button
      type="button"
      class="repeat-remove"
    >
      REMOVE
    </button>
  `;


  row
    .querySelector(
      ".repeat-remove"
    )
    .addEventListener(
      "click",
      () =>
        row.remove()
    );


  container.appendChild(
    row
  );
}


/* ============================================================
   ADD WEIGHT ROW
   ============================================================ */

function addWeightRow(
  record = null
) {

  const container =
    document.getElementById(
      "weightRows"
    );


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "repeat-row weight-row";


  row.innerHTML = `

    <input
      data-field="date"
      type="date"
      value="${escapeHtml(record?.recorded_date || "")}"
    >

    <input
      data-field="weight"
      type="number"
      step="0.01"
      placeholder="Weight"
      value="${escapeHtml(record?.weight || "")}"
    >

    <select data-field="unit">

      <option value="kg"
        ${
          !record?.unit ||
          record?.unit === "kg"
            ? "selected"
            : ""
        }>
        kg
      </option>

      <option value="lb"
        ${
          record?.unit === "lb"
            ? "selected"
            : ""
        }>
        lb
      </option>

    </select>

    <button
      type="button"
      class="repeat-remove"
    >
      REMOVE
    </button>
  `;


  row
    .querySelector(
      ".repeat-remove"
    )
    .addEventListener(
      "click",
      () =>
        row.remove()
    );


  container.appendChild(
    row
  );
}


/* ============================================================
   LOAD OWNER
   ============================================================ */

async function loadOwner(
  ownerId
) {

  if (!ownerId) {
    return null;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("owners")
      .select("*")
      .eq(
        "id",
        ownerId
      )
      .maybeSingle();


  if (error) {

    console.error(
      "Owner loading error:",
      error
    );

    return null;
  }


  return data;
}


/* ============================================================
   LOAD CHILD RECORDS
   ============================================================ */

async function loadChildRecords(
  animalId
) {

  const [
    behaviourResult,
    vaccinationsResult,
    medicalResult,
    weightResult
  ] = await Promise.all([

    supabaseClient
      .from("behaviour_traits")
      .select("*")
      .eq(
        "animal_id",
        animalId
      )
      .maybeSingle(),

    supabaseClient
      .from("vaccinations")
      .select("*")
      .eq(
        "animal_id",
        animalId
      )
      .order(
        "vaccination_date",
        {
          ascending: false
        }
      ),

    supabaseClient
      .from("medical_records")
      .select("*")
      .eq(
        "animal_id",
        animalId
      )
      .order(
        "record_date",
        {
          ascending: false
        }
      ),

    supabaseClient
      .from("weight_history")
      .select("*")
      .eq(
        "animal_id",
        animalId
      )
      .order(
        "recorded_date",
        {
          ascending: false
        }
      )
  ]);


  return {

    behaviour:
      behaviourResult.data || null,

    vaccinations:
      vaccinationsResult.data || [],

    medical:
      medicalResult.data || [],

    weight:
      weightResult.data || []

  };
}


/* ============================================================
   OPEN ADD EDITOR
   ============================================================ */

async function openAddAnimal() {

  createEditorModal();

  editingAnimalId = null;

  const modal =
    document.getElementById(
      "animalEditorModal"
    );


  document.getElementById(
    "editorTitle"
  ).textContent =
    "Add Animal";


  document.getElementById(
    "animalEditorForm"
  ).reset();

   /* ============================================================
   RESET PHOTO FOR NEW ANIMAL
   ============================================================ */

selectedPhotoFile = null;
currentPhotoUrl = "";

const photoFileInput =
  document.getElementById(
    "f_photo_file"
  );

const photoPreview =
  document.getElementById(
    "photoPreview"
  );

const photoStatus =
  document.getElementById(
    "photoUploadStatus"
  );

if (photoFileInput) {
  photoFileInput.value = "";
}

if (photoPreview) {
  photoPreview.innerHTML = `
    <div class="photo-preview-empty">
      🐾 No photo selected
    </div>
  `;
}

if (photoStatus) {
  photoStatus.textContent = "";
}

setField(
  "f_photo",
  ""
);


  document.getElementById(
    "f_owner_country"
  ).value =
    "India";


  document.getElementById(
    "f_location_country"
  ).value =
    "India";


  document.getElementById(
    "f_registration_date"
  ).value =
    new Date()
      .toISOString()
      .slice(0, 10);


  document.getElementById(
    "f_status"
  ).value =
    "ACTIVE RECORD";


  document.getElementById(
    "f_public"
  ).checked =
    true;


  document.getElementById(
    "vaccinationRows"
  ).innerHTML = "";


  document.getElementById(
    "medicalRows"
  ).innerHTML = "";


  document.getElementById(
    "weightRows"
  ).innerHTML = "";


  document.getElementById(
    "editorMessage"
  ).textContent = "";


  modal.classList.add(
    "open"
  );
}


/* ============================================================
   OPEN EDITOR
   ============================================================ */

async function openAnimalEditor(
  animalId
) {

  createEditorModal();

  const animal =
    animalsCache.find(
      item =>
        item.id === animalId
    );


  if (!animal) {

    alert(
      "Animal record could not be found."
    );

    return;
  }


  editingAnimalId =
    animal.id;


  const modal =
    document.getElementById(
      "animalEditorModal"
    );


  document.getElementById(
    "editorTitle"
  ).textContent =
    `Edit Animal • ${animal.name}`;


  setField(
    "f_animal_id",
    animal.animal_id
  );

  setField(
    "f_name",
    animal.name
  );

  setField(
    "f_type",
    animal.type
  );

  setField(
    "f_breed",
    animal.breed
  );

  setField(
    "f_gender",
    animal.gender
  );

  setField(
    "f_dob",
    animal.date_of_birth
  );

  setField(
    "f_colour",
    animal.colour
  );

  setField(
    "f_markings",
    animal.markings
  );

/* ============================================================
   LOAD EXISTING PHOTO
   ============================================================ */

selectedPhotoFile = null;
currentPhotoUrl = animal.photo_url || "";

const photoFileInput =
  document.getElementById(
    "f_photo_file"
  );

const photoPreview =
  document.getElementById(
    "photoPreview"
  );

const photoStatus =
  document.getElementById(
    "photoUploadStatus"
  );

if (photoFileInput) {
  photoFileInput.value = "";
}

setField(
  "f_photo",
  currentPhotoUrl
);

if (currentPhotoUrl) {

  photoPreview.innerHTML = `
    <img
      src="${escapeHtml(currentPhotoUrl)}"
      alt="${escapeHtml(animal.name)}"
    >
  `;

  photoStatus.textContent =
    "Current photo loaded. Choose a new photo to replace it.";

  photoStatus.style.color =
    "#2d8a62";

} else {

  photoPreview.innerHTML = `
    <div class="photo-preview-empty">
      🐾 No photo uploaded
    </div>
  `;

  photoStatus.textContent =
    "";

}

  setField(
    "f_microchip",
    animal.microchip_number
  );

  setField(
    "f_microchip_provider",
    animal.microchip_provider
  );

  setField(
    "f_government_reference",
    animal.government_reference
  );

  setField(
    "f_identification_notes",
    animal.identification_notes
  );


  setField(
    "f_location_city",
    animal.location_city
  );

  setField(
    "f_location_state",
    animal.location_state
  );

  setField(
    "f_location_country",
    animal.location_country || "India"
  );

  setField(
    "f_map_url",
    animal.map_url
  );


  setField(
    "f_status",
    animal.status
  );

  setField(
    "f_registration_date",
    animal.registration_date
  );

  setField(
    "f_public",
    animal.is_public
  );

  setField(
    "f_lost",
    animal.is_lost
  );

  setField(
    "f_special",
    animal.special_instructions
  );

  setField(
    "f_notes",
    animal.notes
  );


  document.getElementById(
    "vaccinationRows"
  ).innerHTML = "";


  document.getElementById(
    "medicalRows"
  ).innerHTML = "";


  document.getElementById(
    "weightRows"
  ).innerHTML = "";


  const owner =
    await loadOwner(
      animal.owner_id
    );


  if (owner) {

    setField(
      "f_owner_name",
      owner.name
    );

    setField(
      "f_owner_phone",
      owner.phone
    );

    setField(
      "f_owner_alt",
      owner.alternate_phone
    );

    setField(
      "f_owner_email",
      owner.email
    );

    setField(
      "f_owner_city",
      owner.city
    );

    setField(
      "f_owner_state",
      owner.state
    );

    setField(
      "f_owner_country",
      owner.country || "India"
    );

    setField(
      "f_owner_postal",
      owner.postal_code
    );

    setField(
      "f_emergency_name",
      owner.emergency_contact_name
    );

    setField(
      "f_emergency_phone",
      owner.emergency_contact_phone
    );
  }


  const records =
    await loadChildRecords(
      animal.id
    );


  if (records.behaviour) {

    setField(
      "f_temperament",
      records.behaviour.temperament
    );

    setField(
      "f_energy",
      records.behaviour.energy_level
    );

    setField(
      "f_children",
      records.behaviour.good_with_children
    );

    setField(
      "f_dogs",
      records.behaviour.good_with_dogs
    );

    setField(
      "f_cats",
      records.behaviour.good_with_cats
    );

    setField(
      "f_stranger",
      records.behaviour.stranger_friendliness
    );

    setField(
      "f_leash",
      records.behaviour.leash_behavior
    );

    setField(
      "f_handling",
      records.behaviour.handling_behavior
    );

    setField(
      "f_food",
      records.behaviour.food_preferences
    );

    setField(
      "f_behaviour_instructions",
      records.behaviour.special_instructions
    );
  }


  records.vaccinations.forEach(
    record =>
      addVaccinationRow(
        record
      )
  );


  records.medical.forEach(
    record =>
      addMedicalRow(
        record
      )
  );


  records.weight.forEach(
    record =>
      addWeightRow(
        record
      )
  );


  document.getElementById(
    "editorMessage"
  ).textContent = "";


  modal.classList.add(
    "open"
  );
}


/* ============================================================
   CLOSE EDITOR
   ============================================================ */

function closeAnimalEditor() {

  const modal =
    document.getElementById(
      "animalEditorModal"
    );


  if (modal) {

    modal.classList.remove(
      "open"
    );
  }


  editingAnimalId =
    null;
}


/* ============================================================
   COLLECT VACCINATIONS
   ============================================================ */

function collectVaccinations() {

  const rows =
    document.querySelectorAll(
      ".vaccination-row"
    );


  return Array.from(
    rows
  )
    .map(row => {

      const get =
        field =>
          row
            .querySelector(
              `[data-field="${field}"]`
            )
            ?.value
            ?.trim() || "";


      return {

        vaccine_name:
          get("vaccine"),

        vaccination_date:
          get("date"),

        next_due_date:
          get("next") || null,

        batch_number:
          get("batch") || null,

        manufacturer:
          get("manufacturer") || null,

        clinic_name:
          get("clinic") || null,

        veterinarian_name:
          get("vet") || null,

        status:
          get("status") ||
          "RECORDED"
      };
    })
    .filter(
      record =>
        record.vaccine_name &&
        record.vaccination_date
    );
}


/* ============================================================
   COLLECT MEDICAL
   ============================================================ */

function collectMedicalRecords() {

  const rows =
    document.querySelectorAll(
      ".medical-row"
    );


  return Array.from(
    rows
  )
    .map(row => {

      const get =
        field =>
          row
            .querySelector(
              `[data-field="${field}"]`
            )
            ?.value
            ?.trim() || "";


      return {

        record_date:
          get("date"),

        record_type:
          get("type") || null,

        diagnosis:
          get("diagnosis") || null,

        treatment:
          get("treatment") || null,

        medication:
          get("medication") || null,

        clinic_name:
          get("clinic") || null,

        veterinarian_name:
          get("vet") || null
      };
    })
    .filter(
      record =>
        record.record_date
    );
}


/* ============================================================
   COLLECT WEIGHT
   ============================================================ */

function collectWeightRecords() {

  const rows =
    document.querySelectorAll(
      ".weight-row"
    );


  return Array.from(
    rows
  )
    .map(row => {

      const get =
        field =>
          row
            .querySelector(
              `[data-field="${field}"]`
            )
            ?.value
            ?.trim() || "";


      return {

        recorded_date:
          get("date"),

        weight:
          get("weight"),

        unit:
          get("unit") ||
          "kg"
      };
    })
    .filter(
      record =>
        record.recorded_date &&
        record.weight
    );
}


/* ============================================================
   SAVE OWNER
   ============================================================ */

async function saveOwner() {

  const ownerName =
    getField(
      "f_owner_name"
    );


  if (!ownerName) {

    return null;
  }


  const ownerData = {

    name:
      ownerName,

    phone:
      getField(
        "f_owner_phone"
      ) || null,

    alternate_phone:
      getField(
        "f_owner_alt"
      ) || null,

    email:
      getField(
        "f_owner_email"
      ) || null,

    city:
      getField(
        "f_owner_city"
      ) || null,

    state:
      getField(
        "f_owner_state"
      ) || null,

    country:
      getField(
        "f_owner_country"
      ) || "India",

    postal_code:
      getField(
        "f_owner_postal"
      ) || null,

    emergency_contact_name:
      getField(
        "f_emergency_name"
      ) || null,

    emergency_contact_phone:
      getField(
        "f_emergency_phone"
      ) || null
  };


  let ownerId =
    editingAnimalId
      ? animalsCache.find(
          a =>
            a.id ===
            editingAnimalId
        )?.owner_id
      : null;


  if (ownerId) {

    const {
      error
    } =
      await supabaseClient
        .from("owners")
        .update(
          ownerData
        )
        .eq(
          "id",
          ownerId
        );


    if (error) {
      throw error;
    }


    return ownerId;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from("owners")
      .insert(
        ownerData
      )
      .select(
        "id"
      )
      .single();


  if (error) {
    throw error;
  }


  return data.id;
}


/* ============================================================
   SAVE BEHAVIOUR
   ============================================================ */

async function saveBehaviour(
  animalId
) {

  const data = {

    animal_id:
      animalId,

    temperament:
      getField(
        "f_temperament"
      ) || null,

    energy_level:
      getField(
        "f_energy"
      ) || null,

    good_with_children:
      getField(
        "f_children"
      ),

    good_with_dogs:
      getField(
        "f_dogs"
      ),

    good_with_cats:
      getField(
        "f_cats"
      ),

    stranger_friendliness:
      getField(
        "f_stranger"
      ) || null,

    leash_behavior:
      getField(
        "f_leash"
      ) || null,

    handling_behavior:
      getField(
        "f_handling"
      ) || null,

    food_preferences:
      getField(
        "f_food"
      ) || null,

    special_instructions:
      getField(
        "f_behaviour_instructions"
      ) || null
  };


  const {
    error
  } =
    await supabaseClient
      .from("behaviour_traits")
      .upsert(
        data,
        {
          onConflict:
            "animal_id"
        }
      );


  if (error) {
    throw error;
  }
}


/* ============================================================
   REPLACE CHILD RECORDS
   ============================================================ */

async function replaceChildRecords(
  animalId,
  vaccinations,
  medical,
  weight
) {

  await Promise.all([

    supabaseClient
      .from("vaccinations")
      .delete()
      .eq(
        "animal_id",
        animalId
      ),

    supabaseClient
      .from("medical_records")
      .delete()
      .eq(
        "animal_id",
        animalId
      ),

    supabaseClient
      .from("weight_history")
      .delete()
      .eq(
        "animal_id",
        animalId
      )
  ]);


  if (vaccinations.length) {

    const rows =
      vaccinations.map(
        record => ({
          ...record,
          animal_id:
            animalId
        })
      );


    const {
      error
    } =
      await supabaseClient
        .from("vaccinations")
        .insert(
          rows
        );


    if (error) {
      throw error;
    }
  }


  if (medical.length) {

    const rows =
      medical.map(
        record => ({
          ...record,
          animal_id:
            animalId
        })
      );


    const {
      error
    } =
      await supabaseClient
        .from("medical_records")
        .insert(
          rows
        );


    if (error) {
      throw error;
    }
  }


  if (weight.length) {

    const rows =
      weight.map(
        record => ({
          ...record,
          animal_id:
            animalId
        })
      );


    const {
      error
    } =
      await supabaseClient
        .from("weight_history")
        .insert(
          rows
        );


    if (error) {
      throw error;
    }
  }
}


/* ============================================================
   SAVE ANIMAL
   ============================================================ */

async function saveAnimal() {

  const saveButton =
    document.getElementById(
      "editorSave"
    );

  const message =
    document.getElementById(
      "editorMessage"
    );


  message.textContent =
    "";


  const animalId =
    getField(
      "f_animal_id"
    );

  const name =
    getField(
      "f_name"
    );

  const type =
    getField(
      "f_type"
    );


  if (
    !animalId ||
    !name ||
    !type
  ) {

    message.textContent =
      "Animal ID, Name and Type are required.";

    return;
  }


  saveButton.disabled =
    true;

  saveButton.textContent =
    "SAVING...";


  try {

    /*
      Check duplicate Animal ID
    */

    let duplicateQuery =
      supabaseClient
        .from("animals")
        .select("id")
        .eq(
          "animal_id",
          animalId
        );


    if (editingAnimalId) {

      duplicateQuery =
        duplicateQuery.neq(
          "id",
          editingAnimalId
        );
    }


    const {
      data: duplicate
    } =
      await duplicateQuery.maybeSingle();


    if (duplicate) {

      throw new Error(
        `Animal ID "${animalId}" is already in use.`
      );
    }


    /*
      Save owner first
    */

    const ownerId =
      await saveOwner();


    /*
      Animal data
    */

    const animalData = {

      animal_id:
        animalId,

      name:
        name,

      type:
        type,

      breed:
        getField(
          "f_breed"
        ) || null,

      gender:
        getField(
          "f_gender"
        ) || null,

      date_of_birth:
        getField(
          "f_dob"
        ) || null,

      colour:
        getField(
          "f_colour"
        ) || null,

      markings:
        getField(
          "f_markings"
        ) || null,

      microchip_number:
        getField(
          "f_microchip"
        ) || null,

      microchip_provider:
        getField(
          "f_microchip_provider"
        ) || null,

      identification_notes:
        getField(
          "f_identification_notes"
        ) || null,

      government_reference:
        getField(
          "f_government_reference"
        ) || null,

      photo_url:
        currentPhotoUrl || null,

      owner_id:
        ownerId,

      location_city:
        getField(
          "f_location_city"
        ) || null,

      location_state:
        getField(
          "f_location_state"
        ) || null,

      location_country:
        getField(
          "f_location_country"
        ) || "India",

      map_url:
        getField(
          "f_map_url"
        ) || null,

      status:
        getField(
          "f_status"
        ) || "ACTIVE RECORD",

      is_public:
        getField(
          "f_public"
        ),

      is_lost:
        getField(
          "f_lost"
        ),

      special_instructions:
        getField(
          "f_special"
        ) || null,

      notes:
        getField(
          "f_notes"
        ) || null,

      registration_date:
        getField(
          "f_registration_date"
        ) ||
        new Date()
          .toISOString()
          .slice(0,10)
    };


    /*
      INSERT or UPDATE
    */

    let savedAnimalId =
      editingAnimalId;


    if (editingAnimalId) {

      const {
        error
      } =
        await supabaseClient
          .from("animals")
          .update(
            animalData
          )
          .eq(
            "id",
            editingAnimalId
          );


      if (error) {
        throw error;
      }

    } else {

      const {
        data,
        error
      } =
        await supabaseClient
          .from("animals")
          .insert(
            animalData
          )
          .select(
            "id"
          )
          .single();


      if (error) {
        throw error;
      }


      savedAnimalId =
        data.id;
    }

     /*
  PHOTO UPLOAD
*/

if (selectedPhotoFile) {

  message.style.color =
    "#245579";

  message.textContent =
    "Uploading animal photo...";


  const uploadedPhotoUrl =
    await uploadAnimalPhoto(
      savedAnimalId,
      selectedPhotoFile
    );


  const {
    error: photoUpdateError
  } =
    await supabaseClient
      .from("animals")
      .update({
        photo_url:
          uploadedPhotoUrl
      })
      .eq(
        "id",
        savedAnimalId
      );


  if (photoUpdateError) {
    throw photoUpdateError;
  }


  currentPhotoUrl =
    uploadedPhotoUrl;

  selectedPhotoFile =
    null;
}

    /*
      Behaviour
    */

    await saveBehaviour(
      savedAnimalId
    );


    /*
      Health records
    */

    await replaceChildRecords(

      savedAnimalId,

      collectVaccinations(),

      collectMedicalRecords(),

      collectWeightRecords()

    );


    message.style.color =
      "#2d8a62";

    message.textContent =
      "Animal saved successfully.";


    await loadAnimals();

    await loadChangeRequests();


    setTimeout(
      () => {

        closeAnimalEditor();

      },
      700
    );


  } catch (error) {

    console.error(
      "Save animal error:",
      error
    );


    message.style.color =
      "#b84c4c";


    message.textContent =
      error.message ||
      "Unable to save animal.";

  } finally {

    saveButton.disabled =
      false;

    saveButton.textContent =
      "SAVE ANIMAL";
  }
}


/* ============================================================
   FORM EVENTS
   ============================================================ */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    await login(
      emailInput.value,
      passwordInput.value
    );
  }
);


logoutButton.addEventListener(
  "click",
  logout
);


animalSearch.addEventListener(
  "input",
  event => {

    searchAnimals(
      event.target.value
    );
  }
);


addAnimalButton.addEventListener(
  "click",
  openAddAnimal
);


emptyAddAnimalButton.addEventListener(
  "click",
  openAddAnimal
);


/* ============================================================
   ESC KEY
   ============================================================ */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeAnimalEditor();
    }
  }
);


/* ============================================================
   AUTH STATE
   ============================================================ */

supabaseClient.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (!session) {

      currentUser = null;
      currentAdmin = null;

      showLogin();

      return;
    }


    if (
      currentUser &&
      currentAdmin
    ) {

      return;
    }


    try {

      currentUser =
        session.user;


      currentAdmin =
        await getAdminProfile(
          currentUser.id
        );


      updateAdminHeader();

      showAdminApp();

      await loadDashboard();

    } catch (error) {

      console.error(
        "Session verification error:",
        error
      );


      await supabaseClient.auth.signOut();

      currentUser = null;
      currentAdmin = null;

      showLogin();

      showLoginMessage(
        error.message
      );
    }
  }
);


/* ============================================================
   INITIALIZE
   ============================================================ */

async function initialize() {

  showLogin();


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      return;
    }


    if (!data.session) {

      return;
    }


    currentUser =
      data.session.user;


    currentAdmin =
      await getAdminProfile(
        currentUser.id
      );


    updateAdminHeader();

    showAdminApp();

    await loadDashboard();


  } catch (error) {

    console.error(
      "Initialization error:",
      error
    );


    await supabaseClient.auth.signOut();

    currentUser = null;
    currentAdmin = null;

    showLogin();
  }
}


/* ============================================================
   START
   ============================================================ */

initialize();
