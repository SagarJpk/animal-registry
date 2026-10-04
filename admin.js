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
   PHOTO STORAGE
   ============================================================ */

const ANIMAL_PHOTO_BUCKET =
  "animal-photos";

const MAX_PHOTO_SIZE =
  5 * 1024 * 1024;


function getPhotoExtension(
  file
) {

  const type =
    file?.type || "";


  if (type === "image/png") {
    return "png";
  }


  if (type === "image/webp") {
    return "webp";
  }


  return "jpg";
}


async function uploadAnimalPhoto(
  animalUuid,
  file = selectedPhotoFile
) {

  if (!file) {
    return currentPhotoUrl || null;
  }


  if (!animalUuid) {
    throw new Error(
      "Animal ID is required before uploading a photo."
    );
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (!allowedTypes.includes(file.type)) {

    throw new Error(
      "Please select JPG, PNG or WebP."
    );
  }


  if (file.size > MAX_PHOTO_SIZE) {

    throw new Error(
      "Photo must be 5 MB or smaller."
    );
  }


  const extension =
    getPhotoExtension(file);


  const storagePath =
    `${animalUuid}/profile-${Date.now()}.${extension}`;


  const {
    error: uploadError
  } =
    await supabaseClient.storage
      .from(
        ANIMAL_PHOTO_BUCKET
      )
      .upload(
        storagePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        }
      );


  if (uploadError) {

    throw new Error(
      `Photo upload failed: ${uploadError.message}`
    );
  }


  const {
    data
  } =
    supabaseClient.storage
      .from(
        ANIMAL_PHOTO_BUCKET
      )
      .getPublicUrl(
        storagePath
      );


  const publicUrl =
    data?.publicUrl || "";


  if (!publicUrl) {

    throw new Error(
      "Photo uploaded, but its public URL could not be created."
    );
  }


  return publicUrl;
}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHtml(
  value
) {

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

  loginMessage.textContent =
    "";
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
  } =
    await supabaseClient
      .from(
        "profiles"
      )
      .select(
        "id,email,full_name,phone,role"
      )
      .eq(
        "id",
        userId
      )
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


  if (
    data.role !== "admin"
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

  setLoginLoading(
    true
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({
          email:
            email.trim(),
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

      await supabaseClient.auth
        .signOut();


      currentUser =
        null;
    }


    showLoginMessage(
      error.message ||
      "Unable to sign in."
    );


  } finally {

    setLoginLoading(
      false
    );
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

    await supabaseClient.auth
      .signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  } finally {

    currentUser =
      null;

    currentAdmin =
      null;

    animalsCache =
      [];

    editingAnimalId =
      null;

    selectedPhotoFile =
      null;

    currentPhotoUrl =
      "";


    showLogin();


    passwordInput.value =
      "";


    clearLoginMessage();


    animalList.innerHTML =
      "";


    totalAnimals.textContent =
      "0";

    activeAnimals.textContent =
      "0";

    lostAnimals.textContent =
      "0";

    changeRequests.textContent =
      "0";
  }
}


/* ============================================================
   DASHBOARD
   ============================================================ */

async function loadDashboard() {

  setLoading(
    true
  );

  ensureChangeRequestPanel();


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
          ${escapeHtml(
            error.message
          )}
        </p>

      </div>
    `;
  }


  setLoading(
    false
  );
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
      .from(
        "animals"
      )
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

const CHANGE_REQUEST_PUBLIC_PROFILE_URL =
  "https://sagarjpk.github.io/animal-registry/profile.html?id=";

let changeRequestsCache = [];


function ensureChangeRequestStyles() {

  if (
    document.getElementById(
      "changeRequestAdminStyles"
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "changeRequestAdminStyles";


  style.textContent = `
    .change-request-stat{
      position:relative;
      cursor:pointer
    }

    .change-request-notification{
      position:absolute;
      top:10px;
      right:10px;
      min-width:20px;
      height:20px;
      padding:0 5px;
      display:none;
      align-items:center;
      justify-content:center;
      border-radius:999px;
      background:#c53d4d;
      color:#fff;
      font-size:8px;
      font-weight:900;
      box-shadow:0 4px 10px rgba(197,61,77,.28)
    }

    .change-request-panel{
      margin-top:18px;
      padding:18px;
      border-radius:20px;
      background:var(--surface);
      box-shadow:var(--shadow-soft)
    }

    .change-request-panel-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      margin-bottom:14px
    }

    .change-request-panel-title{
      color:var(--navy);
      font-size:15px;
      font-weight:900
    }

    .change-request-panel-subtitle{
      margin-top:3px;
      color:var(--muted);
      font-size:9px
    }

    .change-request-refresh,
    .change-request-action{
      border:0;
      border-radius:9px;
      padding:8px 10px;
      background:var(--surface);
      color:var(--navy);
      box-shadow:var(--shadow-soft);
      font-size:8px;
      font-weight:900;
      cursor:pointer
    }

    .change-request-item{
      display:grid;
      grid-template-columns:54px minmax(0,1fr) auto;
      gap:13px;
      align-items:start;
      padding:13px;
      margin-top:10px;
      border-radius:15px;
      background:rgba(255,255,255,.35);
      box-shadow:var(--shadow-inset)
    }

    .change-request-item:first-child{
      margin-top:0
    }

    .change-request-photo{
      width:54px;
      height:64px;
      overflow:hidden;
      border-radius:11px;
      background:#dce4e9;
      display:grid;
      place-items:center;
      color:var(--muted);
      font-size:20px
    }

    .change-request-photo img{
      width:100%;
      height:100%;
      display:block;
      object-fit:cover
    }

    .change-request-top{
      display:flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap
    }

    .change-request-animal{
      color:var(--navy);
      font-size:12px;
      font-weight:900
    }

    .change-request-badge{
      display:inline-flex;
      padding:4px 8px;
      border-radius:999px;
      background:rgba(197,61,77,.12);
      color:#a53a48;
      font-size:7px;
      font-weight:900
    }

    .change-request-id{
      margin-top:3px;
      color:var(--muted);
      font-size:9px;
      font-weight:700
    }

    .change-request-meta{
      display:flex;
      flex-wrap:wrap;
      gap:8px 13px;
      margin-top:8px;
      color:var(--muted);
      font-size:8px
    }

    .change-request-message{
      margin-top:9px;
      padding:9px 10px;
      border-radius:10px;
      background:rgba(36,85,121,.06);
      color:var(--text);
      font-size:9px;
      line-height:1.55;
      white-space:pre-wrap;
      word-break:break-word
    }

    .change-request-actions{
      display:flex;
      flex-direction:column;
      gap:7px;
      min-width:120px
    }

    .change-request-action.primary{
      color:#fff;
      background:linear-gradient(
        135deg,
        #245579,
        #173d5d
      )
    }

    .change-request-action.review{
      color:#287651;
      background:rgba(45,138,98,.10)
    }

    .change-request-action.reject{
      color:#a64040;
      background:rgba(184,76,76,.10)
    }

    .change-request-action:disabled{
      opacity:.55;
      cursor:default
    }

    .change-request-empty,
    .change-request-loading{
      padding:18px;
      border-radius:14px;
      color:var(--muted);
      text-align:center;
      font-size:9px
    }

    .change-request-empty{
      background:rgba(45,138,98,.06)
    }

    .change-request-attachment{
      display:inline-flex;
      margin-top:8px;
      color:#245579;
      font-size:8px;
      font-weight:800
    }

    @media(max-width:700px){

      .change-request-item{
        grid-template-columns:
          46px
          minmax(0,1fr)
      }

      .change-request-photo{
        width:46px;
        height:56px
      }

      .change-request-actions{
        grid-column:1/-1;
        flex-direction:row;
        flex-wrap:wrap;
        min-width:0
      }

    }
  `;


  document.head.appendChild(
    style
  );
}


function ensureChangeRequestPanel() {

  ensureChangeRequestStyles();


  const statsSection =
    changeRequests
      ?.closest(
        ".stat-card"
      )
      ?.parentElement;


  if (!statsSection) {
    return null;
  }


  let panel =
    document.getElementById(
      "changeRequestPanel"
    );


  if (panel) {
    return panel;
  }


  panel =
    document.createElement(
      "section"
    );


  panel.id =
    "changeRequestPanel";


  panel.className =
    "change-request-panel";


  panel.innerHTML = `
    <div class="change-request-panel-header">

      <div>

        <div class="change-request-panel-title">
          🔔 Change Requests
        </div>

        <div class="change-request-panel-subtitle">
          Review requests submitted from Animal Digital ID profiles.
        </div>

      </div>

      <button
        type="button"
        class="change-request-refresh"
        onclick="loadChangeRequests()"
      >
        ↻ Refresh
      </button>

    </div>

    <div id="changeRequestList">

      <div class="change-request-loading">
        Loading change requests...
      </div>

    </div>
  `;


  statsSection.insertAdjacentElement(
    "afterend",
    panel
  );


  const statCard =
    changeRequests.closest(
      ".stat-card"
    );


  if (statCard) {

    statCard.classList.add(
      "change-request-stat"
    );


    statCard.title =
      "Open change requests";


    statCard.addEventListener(
      "click",
      () =>
        panel.scrollIntoView({
          behavior:
            "smooth",
          block:
            "start"
        })
    );


    const badge =
      document.createElement(
        "span"
      );


    badge.id =
      "changeRequestNotification";


    badge.className =
      "change-request-notification";


    statCard.appendChild(
      badge
    );
  }


  return panel;
}


function updateChangeRequestNotification(
  count
) {

  const safeCount =
    Number(
      count
    ) || 0;


  changeRequests.textContent =
    safeCount;


  const badge =
    document.getElementById(
      "changeRequestNotification"
    );


  if (badge) {

    badge.textContent =
      safeCount > 99
        ? "99+"
        : String(
            safeCount
          );


    badge.style.display =
      safeCount > 0
        ? "inline-flex"
        : "none";
  }


  document.title =
    safeCount > 0
      ? `(${safeCount}) Animal Digital ID Admin`
      : "Animal Digital ID Admin";
}


function formatChangeRequestDate(
  value
) {

  if (!value) {
    return "Not available";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(
      value
    );
  }


  return date.toLocaleString(
    "en-IN",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short"
    }
  );
}


async function getChangeRequestAttachmentUrl(
  path
) {

  if (!path) {
    return "";
  }


  const {
    data,
    error
  } =
    await supabaseClient.storage
      .from(
        "change-request-attachments"
      )
      .createSignedUrl(
        path,
        1800
      );


  if (error) {

    console.error(
      "Attachment URL error:",
      error
    );


    return "";
  }


  return data?.signedUrl ||
    "";
}


async function loadChangeRequestAttachmentUrl(
  requestId,
  path
) {

  const button =
    document.querySelector(
      `[data-attachment-request="${requestId}"]`
    );


  if (!button) {
    return;
  }


  button.disabled =
    true;


  button.textContent =
    "OPENING...";


  try {

    const url =
      await getChangeRequestAttachmentUrl(
        path
      );


    if (!url) {

      throw new Error(
        "Unable to create a secure attachment link."
      );
    }


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );


  } catch (error) {

    console.error(
      "Attachment open error:",
      error
    );


    alert(
      error.message ||
      "Unable to open the attachment."
    );


  } finally {

    button.disabled =
      false;


    button.textContent =
      "📎 OPEN DOCUMENT";
  }
}


function renderChangeRequests(
  requests
) {

  ensureChangeRequestPanel();


  const list =
    document.getElementById(
      "changeRequestList"
    );


  if (!list) {
    return;
  }


  if (!requests.length) {

    list.innerHTML = `
      <div class="change-request-empty">
        ✓ No pending change requests.
        The registry is up to date.
      </div>
    `;


    return;
  }


  list.innerHTML =
    requests
      .map(
        request => {

          const animal =
            animalsCache.find(
              item =>
                item.id ===
                  request.animal_uuid ||
                item.animal_id ===
                  request.animal_id
            );


          const photo =
            animal?.photo_url ||
            "";


          const profileUrl =
            request.animal_uuid
              ? `${CHANGE_REQUEST_PUBLIC_PROFILE_URL}${encodeURIComponent(
                  request.animal_uuid
                )}`
              : "";


          const photoHtml =
            photo
              ? `
                <img
                  src="${escapeHtml(
                    photo
                  )}"
                  alt="${escapeHtml(
                    request.animal_name
                  )}"
                >
              `
              : `
                <span>
                  🐾
                </span>
              `;


          const viewButton =
            profileUrl
              ? `
                <button
                  type="button"
                  class="change-request-action"
                  onclick="window.open(
                    '${escapeHtml(
                      profileUrl
                    )}',
                    '_blank',
                    'noopener,noreferrer'
                  )"
                >
                  VIEW ANIMAL
                </button>
              `
              : "";


          const attachmentButton =
            request.attachment_path
              ? `
                <button
                  type="button"
                  class="change-request-action primary"
                  data-attachment-request="${escapeHtml(
                    request.id
                  )}"
                  onclick="loadChangeRequestAttachmentUrl(
                    '${escapeHtml(
                      request.id
                    )}',
                    '${escapeHtml(
                      request.attachment_path
                    )}'
                  )"
                >
                  📎 OPEN DOCUMENT
                </button>
              `
              : "";


          const attachmentInfo =
            request.attachment_name
              ? `
                <div class="change-request-attachment">
                  📎 ${escapeHtml(
                    request.attachment_name
                  )}
                </div>
              `
              : "";


          return `
            <article
              class="change-request-item"
            >

              <div
                class="change-request-photo"
              >
                ${photoHtml}
              </div>


              <div>

                <div
                  class="change-request-top"
                >

                  <span
                    class="change-request-animal"
                  >
                    ${escapeHtml(
                      request.animal_name
                    )}
                  </span>

                  <span
                    class="change-request-badge"
                  >
                    ${escapeHtml(
                      request.status ||
                      "PENDING"
                    )}
                  </span>

                </div>


                <div
                  class="change-request-id"
                >
                  ${escapeHtml(
                    request.animal_id
                  )}
                </div>


                <div
                  class="change-request-meta"
                >

                  <span>
                    👤 ${escapeHtml(
                      request.requester_name
                    )}
                  </span>

                  <span>
                    ✉ ${escapeHtml(
                      request.requester_email
                    )}
                  </span>

                  <span>
                    📝 ${escapeHtml(
                      request.change_type
                    )}
                  </span>

                  <span>
                    🕒 ${escapeHtml(
                      formatChangeRequestDate(
                        request.created_at
                      )
                    )}
                  </span>

                </div>


                <div
                  class="change-request-message"
                >
                  ${escapeHtml(
                    request.message
                  )}
                </div>


                ${attachmentInfo}

              </div>


              <div
                class="change-request-actions"
              >

                ${viewButton}

                ${attachmentButton}


                <button
                  type="button"
                  class="change-request-action review"
                  data-review-request="${escapeHtml(
                    request.id
                  )}"
                  onclick="updateChangeRequestStatus(
                    '${escapeHtml(
                      request.id
                    )}',
                    'REVIEWED'
                  )"
                >
                  ✓ MARK REVIEWED
                </button>


                <button
                  type="button"
                  class="change-request-action reject"
                  data-reject-request="${escapeHtml(
                    request.id
                  )}"
                  onclick="updateChangeRequestStatus(
                    '${escapeHtml(
                      request.id
                    )}',
                    'REJECTED'
                  )"
                >
                  REJECT
                </button>

              </div>

            </article>
          `;
        }
      )
      .join("");
}


async function updateChangeRequestStatus(
  requestId,
  status
) {

  if (
    !requestId ||
    ![
      "REVIEWED",
      "REJECTED"
    ].includes(
      status
    )
  ) {
    return;
  }


  const request =
    changeRequestsCache.find(
      item =>
        item.id ===
        requestId
    );


  if (!request) {
    return;
  }


  const actionText =
    status === "REVIEWED"
      ? "mark this request as reviewed"
      : "reject this request";


  if (
    !window.confirm(
      `Are you sure you want to ${actionText}?`
    )
  ) {
    return;
  }


  const buttons =
    document.querySelectorAll(
      `[data-review-request="${requestId}"],
       [data-reject-request="${requestId}"]`
    );


  buttons.forEach(
    button =>
      button.disabled =
        true
  );


  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "change_requests"
        )
        .update({
          status,
          reviewed_at:
            new Date().toISOString(),
          reviewed_by:
            currentUser?.id ||
            null
        })
        .eq(
          "id",
          requestId
        );


    if (error) {
      throw error;
    }


    await loadChangeRequests();


  } catch (error) {

    console.error(
      "Change request update error:",
      error
    );


    alert(
      error?.message ||
      "Unable to update the change request."
    );


    buttons.forEach(
      button =>
        button.disabled =
          false
    );
  }
}


async function loadChangeRequests() {

  ensureChangeRequestPanel();


  const list =
    document.getElementById(
      "changeRequestList"
    );


  if (list) {

    list.innerHTML = `
      <div class="change-request-loading">
        Loading change requests...
      </div>
    `;
  }


  const {
    data,
    error,
    count
  } =
    await supabaseClient
      .from(
        "change_requests"
      )
      .select(
        `
          id,
          animal_id,
          animal_uuid,
          animal_name,
          requester_name,
          requester_email,
          change_type,
          message,
          attachment_name,
          attachment_type,
          attachment_size,
          attachment_path,
          attachment_storage,
          status,
          created_at,
          reviewed_at,
          reviewed_by
        `,
        {
          count:
            "exact"
        }
      )
      .eq(
        "status",
        "PENDING"
      )
      .order(
        "created_at",
        {
          ascending:
            false
        }
      );


  if (error) {

    console.error(
      "Change request error:",
      error
    );


    changeRequestsCache =
      [];


    updateChangeRequestNotification(
      0
    );


    if (list) {

      list.innerHTML = `
        <div
          class="change-request-empty"
          style="
            color:#a64040;
            background:
              rgba(184,76,76,.08)
          "
        >
          Unable to load change requests.
          ${escapeHtml(
            error.message ||
            "Please check the change_requests table and RLS policies."
          )}
        </div>
      `;
    }


    return;
  }


  changeRequestsCache =
    data || [];


  updateChangeRequestNotification(
    count ||
    changeRequestsCache.length
  );


  renderChangeRequests(
    changeRequestsCache
  );
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


        return searchable.includes(
          q
        );
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
              renderAnimalCard(
                animal
              )
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
    animal.photo_url ||
    "";


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
                src="${escapeHtml(
                  photo
                )}"
                alt="${escapeHtml(
                  animal.name
                )}"
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


      <div
        style="min-width:0"
      >

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
              font-size:15px;
              font-weight:900;
            "
          >
            ${escapeHtml(
              animal.name
            )}
          </strong>


          <span
            style="
              padding:4px 8px;
              border-radius:999px;
              background:
                ${
                  animal.is_lost
                    ? "rgba(184,76,76,.12)"
                    : "rgba(45,138,98,.10)"
                };
              color:
                ${
                  animal.is_lost
                    ? "#a64040"
                    : "#287651"
                };
              font-size:7px;
              font-weight:900;
            "
          >
            ${
              animal.is_lost
                ? "LOST"
                : "ACTIVE"
            }
          </span>

        </div>


        <div
          style="
            margin-top:4px;
            color:var(--muted);
            font-size:9px;
            font-weight:700;
          "
        >
          ${escapeHtml(
            animal.animal_id
          )}
        </div>


        <div
          style="
            display:flex;
            flex-wrap:wrap;
            gap:8px 14px;
            margin-top:8px;
            color:var(--muted);
            font-size:8px;
          "
        >

          <span>
            🐾 ${escapeHtml(
              animal.type
            )}
          </span>

          <span>
            🧬 ${escapeHtml(
              animal.breed ||
              "Not specified"
            )}
          </span>

          <span>
            ⚥ ${escapeHtml(
              animal.gender ||
              "Not specified"
            )}
          </span>

          ${
            location
              ? `
                <span>
                  📍 ${escapeHtml(
                    location
                  )}
                </span>
              `
              : ""
          }

        </div>

      </div>


      <div
        style="
          display:flex;
          flex-direction:column;
          gap:7px;
          align-items:stretch;
        "
      >

        <button
          type="button"
          onclick="openEditAnimal('${escapeHtml(
            animal.id
          )}')"
          style="
            border:0;
            border-radius:9px;
            padding:8px 11px;
            background:var(--surface);
            color:var(--navy);
            box-shadow:var(--shadow-soft);
            font-size:8px;
            font-weight:900;
            cursor:pointer;
          "
        >
          EDIT
        </button>


        <button
          type="button"
          onclick="openAnimalProfile('${escapeHtml(
            animal.id
          )}')"
          style="
            border:0;
            border-radius:9px;
            padding:8px 11px;
            background:
              linear-gradient(
                135deg,
                #245579,
                #173d5d
              );
            color:#fff;
            box-shadow:
              0 5px 12px
              rgba(23,61,93,.18);
            font-size:8px;
            font-weight:900;
            cursor:pointer;
          "
        >
          VIEW ID
        </button>

      </div>

    </div>
  `;
}
/* ============================================================
   ANIMAL PROFILE
   ============================================================ */

function openAnimalProfile(
  animalId
) {

  if (!animalId) {
    return;
  }


  const url =
    `./profile.html?id=${encodeURIComponent(
      animalId
    )}`;


  window.open(
    url,
    "_blank"
  );
}


/* ============================================================
   ADD / EDIT ANIMAL MODAL
   ============================================================ */

function getAnimalModal() {

  let modal =
    document.getElementById(
      "animalModal"
    );


  if (modal) {
    return modal;
  }


  modal =
    document.createElement(
      "div"
    );


  modal.id =
    "animalModal";


  modal.innerHTML = `
    <div
      id="animalModalBackdrop"
      style="
        position:fixed;
        inset:0;
        z-index:9998;
        background:rgba(15,35,50,.42);
        backdrop-filter:blur(5px);
      "
    ></div>


    <div
      style="
        position:fixed;
        inset:0;
        z-index:9999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        overflow:auto;
      "
    >

      <div
        id="animalModalCard"
        style="
          width:min(760px,100%);
          max-height:92vh;
          overflow:auto;
          padding:22px;
          border-radius:24px;
          background:var(--surface);
          box-shadow:
            0 25px 70px
            rgba(15,35,50,.25);
        "
      >

        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
            margin-bottom:18px;
          "
        >

          <div>

            <div
              id="animalModalTitle"
              style="
                color:var(--navy);
                font-size:18px;
                font-weight:900;
              "
            >
              Add Animal
            </div>

            <div
              style="
                margin-top:3px;
                color:var(--muted);
                font-size:9px;
              "
            >
              Create or update an Animal Digital ID record.
            </div>

          </div>


          <button
            type="button"
            onclick="closeAnimalModal()"
            style="
              width:34px;
              height:34px;
              border:0;
              border-radius:50%;
              background:var(--surface);
              color:var(--navy);
              box-shadow:var(--shadow-soft);
              cursor:pointer;
              font-size:16px;
            "
          >
            ×
          </button>

        </div>


        <form
          id="animalForm"
          onsubmit="saveAnimal(event)"
        >

          <input
            type="hidden"
            id="animalFormId"
          >


          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(2,minmax(0,1fr));
              gap:13px;
            "
          >

            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Animal ID
              </label>

              <input
                id="animalFormAnimalId"
                required
                placeholder="e.g. ADI-0001"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Animal Name
              </label>

              <input
                id="animalFormName"
                required
                placeholder="Animal name"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Type
              </label>

              <input
                id="animalFormType"
                placeholder="Dog, Cat, Horse..."
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Breed
              </label>

              <input
                id="animalFormBreed"
                placeholder="Breed"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Gender
              </label>

              <select
                id="animalFormGender"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
                <option value="">
                  Select gender
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


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Date of Birth
              </label>

              <input
                id="animalFormDob"
                type="date"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Colour
              </label>

              <input
                id="animalFormColour"
                placeholder="Colour"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Markings
              </label>

              <input
                id="animalFormMarkings"
                placeholder="Distinctive markings"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Microchip Number
              </label>

              <input
                id="animalFormMicrochip"
                placeholder="Microchip number"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Microchip Provider
              </label>

              <input
                id="animalFormMicrochipProvider"
                placeholder="Provider"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Government Reference
              </label>

              <input
                id="animalFormGovernmentReference"
                placeholder="Reference number"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Status
              </label>

              <select
                id="animalFormStatus"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >

                <option value="ACTIVE RECORD">
                  ACTIVE RECORD
                </option>

                <option value="INACTIVE">
                  INACTIVE
                </option>

                <option value="ARCHIVED">
                  ARCHIVED
                </option>

              </select>
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                City
              </label>

              <input
                id="animalFormCity"
                placeholder="City"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                State
              </label>

              <input
                id="animalFormState"
                placeholder="State"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div>
              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Country
              </label>

              <input
                id="animalFormCountry"
                placeholder="Country"
                value="India"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >
            </div>


            <div
              style="
                grid-column:1/-1;
              "
            >

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Map URL
              </label>

              <input
                id="animalFormMapUrl"
                placeholder="Google Maps URL"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              />

            </div>


            <div
              style="
                grid-column:1/-1;
              "
            >

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Identification Notes
              </label>

              <textarea
                id="animalFormIdentificationNotes"
                rows="3"
                placeholder="Identification details..."
                style="
                  width:100%;
                  box-sizing:border-box;
                  resize:vertical;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                  font-family:inherit;
                "
              ></textarea>

            </div>


            <div
              style="
                grid-column:1/-1;
              "
            >

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Special Instructions
              </label>

              <textarea
                id="animalFormSpecialInstructions"
                rows="3"
                placeholder="Special care or handling instructions..."
                style="
                  width:100%;
                  box-sizing:border-box;
                  resize:vertical;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                  font-family:inherit;
                "
              ></textarea>

            </div>


            <div
              style="
                grid-column:1/-1;
              "
            >

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Notes
              </label>

              <textarea
                id="animalFormNotes"
                rows="3"
                placeholder="Additional notes..."
                style="
                  width:100%;
                  box-sizing:border-box;
                  resize:vertical;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                  font-family:inherit;
                "
              ></textarea>

            </div>


            <div
              style="
                grid-column:1/-1;
                padding:13px;
                border-radius:14px;
                background:rgba(36,85,121,.05);
                box-shadow:var(--shadow-inset);
              "
            >

              <div
                style="
                  color:var(--navy);
                  font-size:9px;
                  font-weight:900;
                  margin-bottom:8px;
                "
              >
                Animal Photo
              </div>


              <div
                id="animalPhotoPreview"
                style="
                  width:110px;
                  height:125px;
                  overflow:hidden;
                  border-radius:13px;
                  background:#dce4e9;
                  display:grid;
                  place-items:center;
                  margin-bottom:10px;
                "
              >
                <span
                  style="
                    font-size:30px;
                  "
                >
                  🐾
                </span>
              </div>


              <input
                id="animalPhotoInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onchange="handleAnimalPhoto(this)"
                style="
                  width:100%;
                  font-size:9px;
                "
              />


              <div
                style="
                  margin-top:6px;
                  color:var(--muted);
                  font-size:8px;
                  line-height:1.5;
                "
              >
                JPG, PNG or WebP • Maximum 5 MB
              </div>

            </div>


            <div
              style="
                grid-column:1/-1;
                display:flex;
                gap:10px;
                align-items:center;
                margin-top:5px;
              "
            >

              <label
                style="
                  display:flex;
                  align-items:center;
                  gap:7px;
                  color:var(--navy);
                  font-size:9px;
                  font-weight:800;
                  cursor:pointer;
                "
              >

                <input
                  id="animalFormPublic"
                  type="checkbox"
                  checked
                />

                Public Digital ID

              </label>


              <label
                style="
                  display:flex;
                  align-items:center;
                  gap:7px;
                  color:var(--navy);
                  font-size:9px;
                  font-weight:800;
                  cursor:pointer;
                "
              >

                <input
                  id="animalFormLost"
                  type="checkbox"
                />

                Mark as Lost

              </label>

            </div>

          </div>


          <div
            id="animalFormMessage"
            style="
              min-height:18px;
              margin-top:12px;
              color:#a64040;
              font-size:9px;
              line-height:1.5;
            "
          ></div>


          <div
            style="
              display:flex;
              justify-content:flex-end;
              gap:9px;
              margin-top:5px;
            "
          >

            <button
              type="button"
              onclick="closeAnimalModal()"
              style="
                border:0;
                border-radius:10px;
                padding:10px 14px;
                background:var(--surface);
                color:var(--navy);
                box-shadow:var(--shadow-soft);
                font-size:8px;
                font-weight:900;
                cursor:pointer;
              "
            >
              CANCEL
            </button>


            <button
              id="animalSaveButton"
              type="submit"
              style="
                border:0;
                border-radius:10px;
                padding:10px 16px;
                background:
                  linear-gradient(
                    135deg,
                    #245579,
                    #173d5d
                  );
                color:#fff;
                box-shadow:
                  0 6px 15px
                  rgba(23,61,93,.20);
                font-size:8px;
                font-weight:900;
                cursor:pointer;
              "
            >
              SAVE ANIMAL
            </button>

          </div>

        </form>

      </div>

    </div>
  `;


  document.body.appendChild(
    modal
  );


  return modal;
}


/* ============================================================
   OPEN ADD ANIMAL
   ============================================================ */

function openAddAnimal() {

  editingAnimalId =
    null;

  selectedPhotoFile =
    null;

  currentPhotoUrl =
    "";


  const modal =
    getAnimalModal();


  document.getElementById(
    "animalModalTitle"
  ).textContent =
    "Add Animal";


  document.getElementById(
    "animalForm"
  ).reset();


  document.getElementById(
    "animalFormCountry"
  ).value =
    "India";


  document.getElementById(
    "animalFormPublic"
  ).checked =
    true;


  document.getElementById(
    "animalFormLost"
  ).checked =
    false;


  document.getElementById(
    "animalFormMessage"
  ).textContent =
    "";


  document.getElementById(
    "animalPhotoPreview"
  ).innerHTML = `
    <span
      style="
        font-size:30px;
      "
    >
      🐾
    </span>
  `;


  document.getElementById(
    "animalPhotoInput"
  ).value =
    "";


  document.getElementById(
    "animalFormId"
  ).value =
    "";


  document.getElementById(
    "animalSaveButton"
  ).textContent =
    "SAVE ANIMAL";


  modal.style.display =
    "block";
}


/* ============================================================
   OPEN EDIT ANIMAL
   ============================================================ */

function openEditAnimal(
  animalId
) {

  const animal =
    animalsCache.find(
      item =>
        item.id ===
        animalId
    );


  if (!animal) {

    alert(
      "Animal record could not be found."
    );

    return;
  }


  editingAnimalId =
    animal.id;


  selectedPhotoFile =
    null;


  currentPhotoUrl =
    animal.photo_url ||
    "";


  const modal =
    getAnimalModal();


  document.getElementById(
    "animalModalTitle"
  ).textContent =
    "Edit Animal";


  document.getElementById(
    "animalFormId"
  ).value =
    animal.id || "";


  document.getElementById(
    "animalFormAnimalId"
  ).value =
    animal.animal_id || "";


  document.getElementById(
    "animalFormName"
  ).value =
    animal.name || "";


  document.getElementById(
    "animalFormType"
  ).value =
    animal.type || "";


  document.getElementById(
    "animalFormBreed"
  ).value =
    animal.breed || "";


  document.getElementById(
    "animalFormGender"
  ).value =
    animal.gender || "";


  document.getElementById(
    "animalFormDob"
  ).value =
    animal.date_of_birth || "";


  document.getElementById(
    "animalFormColour"
  ).value =
    animal.colour || "";


  document.getElementById(
    "animalFormMarkings"
  ).value =
    animal.markings || "";


  document.getElementById(
    "animalFormMicrochip"
  ).value =
    animal.microchip_number || "";


  document.getElementById(
    "animalFormMicrochipProvider"
  ).value =
    animal.microchip_provider || "";


  document.getElementById(
    "animalFormGovernmentReference"
  ).value =
    animal.government_reference || "";


  document.getElementById(
    "animalFormStatus"
  ).value =
    animal.status ||
    "ACTIVE RECORD";


  document.getElementById(
    "animalFormCity"
  ).value =
    animal.location_city || "";


  document.getElementById(
    "animalFormState"
  ).value =
    animal.location_state || "";


  document.getElementById(
    "animalFormCountry"
  ).value =
    animal.location_country ||
    "India";


  document.getElementById(
    "animalFormMapUrl"
  ).value =
    animal.map_url || "";


  document.getElementById(
    "animalFormIdentificationNotes"
  ).value =
    animal.identification_notes ||
    "";


  document.getElementById(
    "animalFormSpecialInstructions"
  ).value =
    animal.special_instructions ||
    "";


  document.getElementById(
    "animalFormNotes"
  ).value =
    animal.notes ||
    "";


  document.getElementById(
    "animalFormPublic"
  ).checked =
    animal.is_public !== false;


  document.getElementById(
    "animalFormLost"
  ).checked =
    animal.is_lost === true;


  document.getElementById(
    "animalFormMessage"
  ).textContent =
    "";


  document.getElementById(
    "animalPhotoInput"
  ).value =
    "";


  if (
    animal.photo_url
  ) {

    document.getElementById(
      "animalPhotoPreview"
    ).innerHTML = `
      <img
        src="${escapeHtml(
          animal.photo_url
        )}"
        alt="${escapeHtml(
          animal.name ||
          "Animal"
        )}"
        style="
          width:100%;
          height:100%;
          display:block;
          object-fit:cover;
        "
      />
    `;

  } else {

    document.getElementById(
      "animalPhotoPreview"
    ).innerHTML = `
      <span
        style="
          font-size:30px;
        "
      >
        🐾
      </span>
    `;
  }


  document.getElementById(
    "animalSaveButton"
  ).textContent =
    "UPDATE ANIMAL";


  modal.style.display =
    "block";
}


/* ============================================================
   CLOSE ANIMAL MODAL
   ============================================================ */

function closeAnimalModal() {

  const modal =
    document.getElementById(
      "animalModal"
    );


  if (!modal) {
    return;
  }


  modal.style.display =
    "none";


  editingAnimalId =
    null;


  selectedPhotoFile =
    null;


  currentPhotoUrl =
    "";
}


/* ============================================================
   PHOTO SELECTION
   ============================================================ */

function handleAnimalPhoto(
  input
) {

  const file =
    input?.files?.[0];


  if (!file) {

    selectedPhotoFile =
      null;

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

    alert(
      "Please select a JPG, PNG or WebP image."
    );


    input.value =
      "";


    selectedPhotoFile =
      null;


    return;
  }


  if (
    file.size >
    MAX_PHOTO_SIZE
  ) {

    alert(
      "Photo must be 5 MB or smaller."
    );


    input.value =
      "";


    selectedPhotoFile =
      null;


    return;
  }


  selectedPhotoFile =
    file;


  const reader =
    new FileReader();


  reader.onload =
    function () {

      const preview =
        document.getElementById(
          "animalPhotoPreview"
        );


      if (!preview) {
        return;
      }


      preview.innerHTML = `
        <img
          src="${reader.result}"
          alt="Selected animal photo"
          style="
            width:100%;
            height:100%;
            display:block;
            object-fit:cover;
          "
        />
      `;
    };


  reader.readAsDataURL(
    file
  );
}


/* ============================================================
   SAVE ANIMAL
   ============================================================ */

async function saveAnimal(
  event
) {

  event.preventDefault();


  const saveButton =
    document.getElementById(
      "animalSaveButton"
    );


  const message =
    document.getElementById(
      "animalFormMessage"
    );


  message.textContent =
    "";


  saveButton.disabled =
    true;


  saveButton.textContent =
    editingAnimalId
      ? "UPDATING..."
      : "SAVING...";


  try {

    const animalData = {

      animal_id:
        document.getElementById(
          "animalFormAnimalId"
        ).value.trim(),

      name:
        document.getElementById(
          "animalFormName"
        ).value.trim(),

      type:
        document.getElementById(
          "animalFormType"
        ).value.trim() ||
        null,

      breed:
        document.getElementById(
          "animalFormBreed"
        ).value.trim() ||
        null,

      gender:
        document.getElementById(
          "animalFormGender"
        ).value ||
        null,

      date_of_birth:
        document.getElementById(
          "animalFormDob"
        ).value ||
        null,

      colour:
        document.getElementById(
          "animalFormColour"
        ).value.trim() ||
        null,

      markings:
        document.getElementById(
          "animalFormMarkings"
        ).value.trim() ||
        null,

      microchip_number:
        document.getElementById(
          "animalFormMicrochip"
        ).value.trim() ||
        null,

      microchip_provider:
        document.getElementById(
          "animalFormMicrochipProvider"
        ).value.trim() ||
        null,

      government_reference:
        document.getElementById(
          "animalFormGovernmentReference"
        ).value.trim() ||
        null,

      status:
        document.getElementById(
          "animalFormStatus"
        ).value ||
        "ACTIVE RECORD",

      location_city:
        document.getElementById(
          "animalFormCity"
        ).value.trim() ||
        null,

      location_state:
        document.getElementById(
          "animalFormState"
        ).value.trim() ||
        null,

      location_country:
        document.getElementById(
          "animalFormCountry"
        ).value.trim() ||
        "India",

      map_url:
        document.getElementById(
          "animalFormMapUrl"
        ).value.trim() ||
        null,

      identification_notes:
        document.getElementById(
          "animalFormIdentificationNotes"
        ).value.trim() ||
        null,

      special_instructions:
        document.getElementById(
          "animalFormSpecialInstructions"
        ).value.trim() ||
        null,

      notes:
        document.getElementById(
          "animalFormNotes"
        ).value.trim() ||
        null,

      is_public:
        document.getElementById(
          "animalFormPublic"
        ).checked,

      is_lost:
        document.getElementById(
          "animalFormLost"
        ).checked

    };


    if (
      !animalData.animal_id
    ) {

      throw new Error(
        "Animal ID is required."
      );
    }


    if (
      !animalData.name
    ) {

      throw new Error(
        "Animal name is required."
      );
    }


    if (
      !editingAnimalId &&
      selectedPhotoFile
    ) {

      animalData.photo_url =
        null;
    }


    let savedAnimal;


    if (
      editingAnimalId
    ) {

      const {
        data,
        error
      } =
        await supabaseClient
          .from(
            "animals"
          )
          .update(
            animalData
          )
          .eq(
            "id",
            editingAnimalId
          )
          .select()
          .single();


      if (error) {
        throw error;
      }


      savedAnimal =
        data;

    } else {

      const {
        data,
        error
      } =
        await supabaseClient
          .from(
            "animals"
          )
          .insert(
            animalData
          )
          .select()
          .single();


      if (error) {
        throw error;
      }


      savedAnimal =
        data;
    }


    if (
      selectedPhotoFile
    ) {

      const photoUrl =
        await uploadAnimalPhoto(
          savedAnimal.id,
          selectedPhotoFile
        );


      const {
        error:
          photoUpdateError
      } =
        await supabaseClient
          .from(
            "animals"
          )
          .update({
            photo_url:
              photoUrl
          })
          .eq(
            "id",
            savedAnimal.id
          );


      if (
        photoUpdateError
      ) {
        throw photoUpdateError;
      }
    }


    closeAnimalModal();


    await loadAnimals();


    alert(
      editingAnimalId
        ? "Animal record updated successfully."
        : "Animal record created successfully."
    );


  } catch (error) {

    console.error(
      "Save animal error:",
      error
    );


    message.textContent =
      error?.message ||
      "Unable to save animal record.";


  } finally {

    saveButton.disabled =
      false;


    saveButton.textContent =
      editingAnimalId
        ? "UPDATE ANIMAL"
        : "SAVE ANIMAL";
  }
}


/* ============================================================
   DELETE ANIMAL
   ============================================================ */

async function deleteAnimal(
  animalId
) {

  const animal =
    animalsCache.find(
      item =>
        item.id ===
        animalId
    );


  if (!animal) {
    return;
  }


  const confirmed =
    window.confirm(
      `Delete ${animal.name || "this animal"} permanently?\n\nThis action cannot be undone.`
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "animals"
        )
        .delete()
        .eq(
          "id",
          animalId
        );


    if (error) {
      throw error;
    }


    await loadAnimals();


    alert(
      "Animal record deleted."
    );


  } catch (error) {

    console.error(
      "Delete animal error:",
      error
    );


    alert(
      error?.message ||
      "Unable to delete animal."
    );
  }
}


/* ============================================================
   LOADING STATE
   ============================================================ */

function setLoading(
  isLoading
) {

  if (!loading) {
    return;
  }


  loading.style.display =
    isLoading
      ? "block"
      : "none";
}


/* ============================================================
   EVENT HANDLERS
   ============================================================ */

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      login(
        emailInput.value,
        passwordInput.value
      );
    }
  );
}


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    logout
  );
}


if (animalSearch) {

  animalSearch.addEventListener(
    "input",
    event => {

      searchAnimals(
        event.target.value
      );
    }
  );
}


if (addAnimalButton) {

  addAnimalButton.addEventListener(
    "click",
    openAddAnimal
  );
}


if (emptyAddAnimalButton) {

  emptyAddAnimalButton.addEventListener(
    "click",
    openAddAnimal
  );
}


/* ============================================================
   ESC KEY
   ============================================================ */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeAnimalModal();
    }
  }
);


/* ============================================================
   AUTH STATE
   ============================================================ */

async function initializeAdmin() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();


    if (error) {
      throw error;
    }


    const session =
      data?.session;


    if (!session?.user) {

      showLogin();

      return;
    }


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
      "Admin initialization error:",
      error
    );


    currentUser =
      null;

    currentAdmin =
      null;


    showLogin();


    if (
      error?.message
    ) {

      showLoginMessage(
        error.message
      );
    }
  }
}


supabaseClient.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (
      event ===
      "SIGNED_OUT"
    ) {

      currentUser =
        null;

      currentAdmin =
        null;


      showLogin();

      return;
    }


    if (
      event ===
        "SIGNED_IN" &&
      session?.user
    ) {

      currentUser =
        session.user;


      try {

        currentAdmin =
          await getAdminProfile(
            currentUser.id
          );


        updateAdminHeader();

        showAdminApp();

        await loadDashboard();


      } catch (error) {

        console.error(
          "Auth state admin validation error:",
          error
        );


        await supabaseClient.auth
          .signOut();


        showLogin();

        showLoginMessage(
          error.message ||
          "Administrator access could not be verified."
        );
      }
    }
  }
);


/* ============================================================
   INITIALIZE
   ============================================================ */

initializeAdmin();


/* ============================================================
   END OF PART 2
   ============================================================ */
   /* ============================================================
   PART 3
   OWNER MANAGEMENT
   ============================================================ */


/* ============================================================
   OWNER STATE
   ============================================================ */

let ownersCache = [];

let editingOwnerId = null;


/* ============================================================
   OWNER MODAL
   ============================================================ */

function getOwnerModal() {

  let modal =
    document.getElementById(
      "ownerModal"
    );


  if (modal) {
    return modal;
  }


  modal =
    document.createElement(
      "div"
    );


  modal.id =
    "ownerModal";


  modal.innerHTML = `
    <div
      style="
        position:fixed;
        inset:0;
        z-index:10000;
        background:rgba(15,35,50,.42);
        backdrop-filter:blur(5px);
      "
      onclick="closeOwnerModal(event)"
    ></div>


    <div
      style="
        position:fixed;
        inset:0;
        z-index:10001;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        overflow:auto;
        pointer-events:none;
      "
    >

      <div
        style="
          width:min(620px,100%);
          max-height:90vh;
          overflow:auto;
          padding:22px;
          border-radius:24px;
          background:var(--surface);
          box-shadow:
            0 25px 70px
            rgba(15,35,50,.25);
          pointer-events:auto;
        "
        onclick="event.stopPropagation()"
      >

        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
            margin-bottom:18px;
          "
        >

          <div>

            <div
              id="ownerModalTitle"
              style="
                color:var(--navy);
                font-size:18px;
                font-weight:900;
              "
            >
              Add Owner
            </div>

            <div
              style="
                margin-top:3px;
                color:var(--muted);
                font-size:9px;
              "
            >
              Manage animal parent / owner information.
            </div>

          </div>


          <button
            type="button"
            onclick="closeOwnerModal()"
            style="
              width:34px;
              height:34px;
              border:0;
              border-radius:50%;
              background:var(--surface);
              color:var(--navy);
              box-shadow:var(--shadow-soft);
              cursor:pointer;
              font-size:16px;
            "
          >
            ×
          </button>

        </div>


        <form
          id="ownerForm"
          onsubmit="saveOwner(event)"
        >

          <input
            type="hidden"
            id="ownerFormId"
          >


          <div
            style="
              display:grid;
              grid-template-columns:
                repeat(2,minmax(0,1fr));
              gap:13px;
            "
          >

            <div
              style="
                grid-column:1/-1;
              "
            >

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Full Name
              </label>

              <input
                id="ownerFormName"
                required
                placeholder="Owner / parent name"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >

            </div>


            <div>

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Email
              </label>

              <input
                id="ownerFormEmail"
                type="email"
                placeholder="owner@example.com"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >

            </div>


            <div>

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Phone
              </label>

              <input
                id="ownerFormPhone"
                type="tel"
                placeholder="Phone number"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >

            </div>


            <div>

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                City
              </label>

              <input
                id="ownerFormCity"
                placeholder="City"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >

            </div>


            <div>

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                State
              </label>

              <input
                id="ownerFormState"
                placeholder="State"
                style="
                  width:100%;
                  box-sizing:border-box;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                "
              >

            </div>


            <div
              style="
                grid-column:1/-1;
              "
            >

              <label
                style="
                  display:block;
                  margin-bottom:5px;
                  color:var(--navy);
                  font-size:8px;
                  font-weight:900;
                "
              >
                Address
              </label>

              <textarea
                id="ownerFormAddress"
                rows="3"
                placeholder="Address"
                style="
                  width:100%;
                  box-sizing:border-box;
                  resize:vertical;
                  padding:10px 11px;
                  border:0;
                  outline:none;
                  border-radius:11px;
                  background:var(--surface);
                  color:var(--text);
                  box-shadow:var(--shadow-inset);
                  font-family:inherit;
                "
              ></textarea>

            </div>


            <div
              style="
                grid-column:1/-1;
              "
            >

              <label
                style="
                  display:flex;
                  align-items:center;
                  gap:7px;
                  color:var(--navy);
                  font-size:9px;
                  font-weight:800;
                  cursor:pointer;
                "
              >

                <input
                  id="ownerFormActive"
                  type="checkbox"
                  checked
                >

                Active Owner

              </label>

            </div>

          </div>


          <div
            id="ownerFormMessage"
            style="
              min-height:18px;
              margin-top:12px;
              color:#a64040;
              font-size:9px;
              line-height:1.5;
            "
          ></div>


          <div
            style="
              display:flex;
              justify-content:flex-end;
              gap:9px;
              margin-top:5px;
            "
          >

            <button
              type="button"
              onclick="closeOwnerModal()"
              style="
                border:0;
                border-radius:10px;
                padding:10px 14px;
                background:var(--surface);
                color:var(--navy);
                box-shadow:var(--shadow-soft);
                font-size:8px;
                font-weight:900;
                cursor:pointer;
              "
            >
              CANCEL
            </button>


            <button
              id="ownerSaveButton"
              type="submit"
              style="
                border:0;
                border-radius:10px;
                padding:10px 16px;
                background:
                  linear-gradient(
                    135deg,
                    #245579,
                    #173d5d
                  );
                color:#fff;
                box-shadow:
                  0 6px 15px
                  rgba(23,61,93,.20);
                font-size:8px;
                font-weight:900;
                cursor:pointer;
              "
            >
              SAVE OWNER
            </button>

          </div>

        </form>

      </div>

    </div>
  `;


  document.body.appendChild(
    modal
  );


  return modal;
}


/* ============================================================
   LOAD OWNERS
   ============================================================ */

async function loadOwners() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "owners"
      )
      .select(
        `
          id,
          name,
          email,
          phone,
          address,
          city,
          state,
          country,
          is_active,
          created_at,
          updated_at
        `
      )
      .order(
        "created_at",
        {
          ascending:
            false
        }
      );


  if (error) {

    console.error(
      "Owner loading error:",
      error
    );


    throw error;
  }


  ownersCache =
    data || [];


  renderOwners(
    ownersCache
  );
}


/* ============================================================
   RENDER OWNERS
   ============================================================ */

function renderOwners(
  owners
) {

  const container =
    document.getElementById(
      "ownerList"
    );


  if (!container) {
    return;
  }


  if (!owners.length) {

    container.innerHTML = `
      <div
        style="
          padding:20px;
          text-align:center;
          color:var(--muted);
          font-size:9px;
        "
      >
        No owners found.
      </div>
    `;


    return;
  }


  container.innerHTML =
    owners
      .map(
        owner => {

          const animalCount =
            animalsCache.filter(
              animal =>
                animal.owner_id ===
                owner.id
            ).length;


          return `

            <div
              style="
                display:grid;
                grid-template-columns:
                  minmax(0,1fr)
                  auto;
                gap:12px;
                align-items:center;
                padding:13px;
                margin-bottom:10px;
                border-radius:15px;
                background:var(--surface);
                box-shadow:var(--shadow-soft);
              "
            >

              <div>

                <div
                  style="
                    color:var(--navy);
                    font-size:12px;
                    font-weight:900;
                  "
                >
                  ${escapeHtml(
                    owner.name ||
                    "Unnamed Owner"
                  )}
                </div>


                <div
                  style="
                    margin-top:5px;
                    display:flex;
                    flex-wrap:wrap;
                    gap:8px 13px;
                    color:var(--muted);
                    font-size:8px;
                  "
                >

                  <span>
                    ✉ ${escapeHtml(
                      owner.email ||
                      "No email"
                    )}
                  </span>

                  <span>
                    ☎ ${escapeHtml(
                      owner.phone ||
                      "No phone"
                    )}
                  </span>

                  <span>
                    🐾 ${animalCount}
                    animal${
                      animalCount === 1
                        ? ""
                        : "s"
                    }
                  </span>

                </div>

              </div>


              <div
                style="
                  display:flex;
                  gap:7px;
                "
              >

                <button
                  type="button"
                  onclick="openEditOwner('${escapeHtml(
                    owner.id
                  )}')"
                  style="
                    border:0;
                    border-radius:9px;
                    padding:8px 10px;
                    background:var(--surface);
                    color:var(--navy);
                    box-shadow:var(--shadow-soft);
                    font-size:8px;
                    font-weight:900;
                    cursor:pointer;
                  "
                >
                  EDIT
                </button>


                <button
                  type="button"
                  onclick="deleteOwner('${escapeHtml(
                    owner.id
                  )}')"
                  style="
                    border:0;
                    border-radius:9px;
                    padding:8px 10px;
                    background:
                      rgba(184,76,76,.10);
                    color:#a64040;
                    font-size:8px;
                    font-weight:900;
                    cursor:pointer;
                  "
                >
                  DELETE
                </button>

              </div>

            </div>
          `;
        }
      )
      .join("");
}


/* ============================================================
   OPEN ADD OWNER
   ============================================================ */

function openAddOwner() {

  editingOwnerId =
    null;


  const modal =
    getOwnerModal();


  document.getElementById(
    "ownerModalTitle"
  ).textContent =
    "Add Owner";


  document.getElementById(
    "ownerForm"
  ).reset();


  document.getElementById(
    "ownerFormActive"
  ).checked =
    true;


  document.getElementById(
    "ownerFormMessage"
  ).textContent =
    "";


  document.getElementById(
    "ownerFormId"
  ).value =
    "";


  document.getElementById(
    "ownerSaveButton"
  ).textContent =
    "SAVE OWNER";


  modal.style.display =
    "block";
}


/* ============================================================
   OPEN EDIT OWNER
   ============================================================ */

function openEditOwner(
  ownerId
) {

  const owner =
    ownersCache.find(
      item =>
        item.id ===
        ownerId
    );


  if (!owner) {

    alert(
      "Owner record could not be found."
    );


    return;
  }


  editingOwnerId =
    owner.id;


  const modal =
    getOwnerModal();


  document.getElementById(
    "ownerModalTitle"
  ).textContent =
    "Edit Owner";


  document.getElementById(
    "ownerFormId"
  ).value =
    owner.id || "";


  document.getElementById(
    "ownerFormName"
  ).value =
    owner.name || "";


  document.getElementById(
    "ownerFormEmail"
  ).value =
    owner.email || "";


  document.getElementById(
    "ownerFormPhone"
  ).value =
    owner.phone || "";


  document.getElementById(
    "ownerFormCity"
  ).value =
    owner.city || "";


  document.getElementById(
    "ownerFormState"
  ).value =
    owner.state || "";


  document.getElementById(
    "ownerFormAddress"
  ).value =
    owner.address || "";


  document.getElementById(
    "ownerFormActive"
  ).checked =
    owner.is_active !== false;


  document.getElementById(
    "ownerFormMessage"
  ).textContent =
    "";


  document.getElementById(
    "ownerSaveButton"
  ).textContent =
    "UPDATE OWNER";


  modal.style.display =
    "block";
}


/* ============================================================
   CLOSE OWNER MODAL
   ============================================================ */

function closeOwnerModal(
  event
) {

  if (
    event &&
    event.target !==
      event.currentTarget
  ) {

    return;
  }


  const modal =
    document.getElementById(
      "ownerModal"
    );


  if (modal) {

    modal.style.display =
      "none";
  }


  editingOwnerId =
    null;
}


/* ============================================================
   SAVE OWNER
   ============================================================ */

async function saveOwner(
  event
) {

  event.preventDefault();


  const saveButton =
    document.getElementById(
      "ownerSaveButton"
    );


  const message =
    document.getElementById(
      "ownerFormMessage"
    );


  message.textContent =
    "";


  saveButton.disabled =
    true;


  saveButton.textContent =
    editingOwnerId
      ? "UPDATING..."
      : "SAVING...";


  try {

    const ownerData = {

      name:
        document.getElementById(
          "ownerFormName"
        ).value.trim(),

      email:
        document.getElementById(
          "ownerFormEmail"
        ).value.trim() ||
        null,

      phone:
        document.getElementById(
          "ownerFormPhone"
        ).value.trim() ||
        null,

      address:
        document.getElementById(
          "ownerFormAddress"
        ).value.trim() ||
        null,

      city:
        document.getElementById(
          "ownerFormCity"
        ).value.trim() ||
        null,

      state:
        document.getElementById(
          "ownerFormState"
        ).value.trim() ||
        null,

      country:
        "India",

      is_active:
        document.getElementById(
          "ownerFormActive"
        ).checked

    };


    if (
      !ownerData.name
    ) {

      throw new Error(
        "Owner name is required."
      );
    }


    if (
      editingOwnerId
    ) {

      const {
        error
      } =
        await supabaseClient
          .from(
            "owners"
          )
          .update(
            ownerData
          )
          .eq(
            "id",
            editingOwnerId
          );


      if (error) {
        throw error;
      }

    } else {

      const {
        error
      } =
        await supabaseClient
          .from(
            "owners"
          )
          .insert(
            ownerData
          );


      if (error) {
        throw error;
      }
    }


    closeOwnerModal();


    await loadOwners();


    alert(
      editingOwnerId
        ? "Owner updated successfully."
        : "Owner created successfully."
    );


  } catch (error) {

    console.error(
      "Save owner error:",
      error
    );


    message.textContent =
      error?.message ||
      "Unable to save owner.";


  } finally {

    saveButton.disabled =
      false;


    saveButton.textContent =
      editingOwnerId
        ? "UPDATE OWNER"
        : "SAVE OWNER";
  }
}


/* ============================================================
   DELETE OWNER
   ============================================================ */

async function deleteOwner(
  ownerId
) {

  const owner =
    ownersCache.find(
      item =>
        item.id ===
        ownerId
    );


  if (!owner) {
    return;
  }


  const linkedAnimals =
    animalsCache.filter(
      animal =>
        animal.owner_id ===
        ownerId
    );


  if (
    linkedAnimals.length
  ) {

    alert(
      `This owner has ${linkedAnimals.length} linked animal record(s).\n\nPlease reassign or remove the animal owner before deleting this owner.`
    );


    return;
  }


  const confirmed =
    window.confirm(
      `Delete ${owner.name || "this owner"} permanently?`
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "owners"
        )
        .delete()
        .eq(
          "id",
          ownerId
        );


    if (error) {
      throw error;
    }


    await loadOwners();


    alert(
      "Owner deleted successfully."
    );


  } catch (error) {

    console.error(
      "Delete owner error:",
      error
    );


    alert(
      error?.message ||
      "Unable to delete owner."
    );
  }
}


/* ============================================================
   OWNER SEARCH
   ============================================================ */

function searchOwners(
  query
) {

  const q =
    String(
      query || ""
    )
      .trim()
      .toLowerCase();


  if (!q) {

    renderOwners(
      ownersCache
    );


    return;
  }


  const filtered =
    ownersCache.filter(
      owner => {

        const searchable = [

          owner.name,
          owner.email,
          owner.phone,
          owner.city,
          owner.state

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        return searchable.includes(
          q
        );
      }
    );


  renderOwners(
    filtered
  );
}


/* ============================================================
   OWNER UI INJECTION
   ============================================================ */

function ensureOwnerManagementPanel() {

  if (
    document.getElementById(
      "ownerManagementPanel"
    )
  ) {

    return;
  }


  const animalListElement =
    document.getElementById(
      "animalList"
    );


  if (!animalListElement) {
    return;
  }


  const panel =
    document.createElement(
      "section"
    );


  panel.id =
    "ownerManagementPanel";


  panel.style.cssText = `
    margin-top:20px;
    padding:18px;
    border-radius:20px;
    background:var(--surface);
    box-shadow:var(--shadow-soft);
  `;


  panel.innerHTML = `

    <div
      style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        flex-wrap:wrap;
        margin-bottom:14px;
      "
    >

      <div>

        <div
          style="
            color:var(--navy);
            font-size:15px;
            font-weight:900;
          "
        >
          👤 Owners
        </div>

        <div
          style="
            margin-top:3px;
            color:var(--muted);
            font-size:9px;
          "
        >
          Manage registered animal parents and owners.
        </div>

      </div>


      <button
        type="button"
        onclick="openAddOwner()"
        style="
          border:0;
          border-radius:10px;
          padding:9px 12px;
          background:
            linear-gradient(
              135deg,
              #245579,
              #173d5d
            );
          color:#fff;
          font-size:8px;
          font-weight:900;
          cursor:pointer;
        "
      >
        + ADD OWNER
      </button>

    </div>


    <div
      style="
        margin-bottom:12px;
      "
    >

      <input
        id="ownerSearch"
        type="search"
        placeholder="Search owners..."
        oninput="searchOwners(this.value)"
        style="
          width:100%;
          box-sizing:border-box;
          padding:10px 11px;
          border:0;
          outline:none;
          border-radius:11px;
          background:var(--surface);
          color:var(--text);
          box-shadow:var(--shadow-inset);
          font-size:9px;
        "
      >

    </div>


    <div id="ownerList">

      <div
        style="
          padding:18px;
          text-align:center;
          color:var(--muted);
          font-size:9px;
        "
      >
        Loading owners...
      </div>

    </div>

  `;


  animalListElement
    .closest(
      "section"
    )
    ?.insertAdjacentElement(
      "afterend",
      panel
    );


  if (
    !document.getElementById(
      "ownerList"
    )
  ) {

    animalListElement
      .parentElement
      ?.appendChild(
        panel
      );
  }


  loadOwners()
    .catch(
      error => {

        console.error(
          "Owner panel load error:",
          error
        );
      }
    );
}


/* ============================================================
   OWNER PANEL INITIALIZATION
   ============================================================ */

function initializeOwnerManagement() {

  try {

    ensureOwnerManagementPanel();

  } catch (error) {

    console.error(
      "Owner management initialization error:",
      error
    );
  }
}


/* ============================================================
   ADMIN SEARCH HELPERS
   ============================================================ */

function clearAnimalSearch() {

  if (
    animalSearch
  ) {

    animalSearch.value =
      "";

    renderAnimals(
      animalsCache
    );
  }
}


/* ============================================================
   REFRESH DASHBOARD
   ============================================================ */

async function refreshAdminDashboard() {

  setLoading(
    true
  );


  try {

    await loadAnimals();

    await loadChangeRequests();

    initializeOwnerManagement();


  } catch (error) {

    console.error(
      "Dashboard refresh error:",
      error
    );


    alert(
      error?.message ||
      "Unable to refresh the dashboard."
    );


  } finally {

    setLoading(
      false
    );
  }
}


/* ============================================================
   GLOBAL ADMIN HELPERS
   ============================================================ */

window.openAddAnimal =
  openAddAnimal;

window.openEditAnimal =
  openEditAnimal;

window.closeAnimalModal =
  closeAnimalModal;

window.saveAnimal =
  saveAnimal;

window.deleteAnimal =
  deleteAnimal;

window.handleAnimalPhoto =
  handleAnimalPhoto;

window.openAnimalProfile =
  openAnimalProfile;

window.openAddOwner =
  openAddOwner;

window.openEditOwner =
  openEditOwner;

window.closeOwnerModal =
  closeOwnerModal;

window.saveOwner =
  saveOwner;

window.deleteOwner =
  deleteOwner;

window.searchOwners =
  searchOwners;

window.loadChangeRequests =
  loadChangeRequests;

window.updateChangeRequestStatus =
  updateChangeRequestStatus;

window.loadChangeRequestAttachmentUrl =
  loadChangeRequestAttachmentUrl;

window.refreshAdminDashboard =
  refreshAdminDashboard;


/* ============================================================
   PART 3 COMPLETE
   ============================================================ */
   /* ============================================================
   PART 4
   OWNER ASSIGNMENT + ANIMAL RECORD UTILITIES
   ============================================================ */


/* ============================================================
   OWNER DROPDOWN
   ============================================================ */

async function populateAnimalOwnerDropdown(
  selectedOwnerId = ""
) {

  let select =
    document.getElementById(
      "animalFormOwner"
    );


  if (!select) {
    return;
  }


  if (!ownersCache.length) {

    try {

      await loadOwners();

    } catch (error) {

      console.error(
        "Unable to load owners for dropdown:",
        error
      );
    }
  }


  select.innerHTML = `
    <option value="">
      No owner assigned
    </option>
  `;


  ownersCache
    .filter(
      owner =>
        owner.is_active !== false
    )
    .forEach(
      owner => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          owner.id;


        option.textContent =
          owner.name ||
          "Unnamed Owner";


        if (
          String(
            owner.id
          ) ===
          String(
            selectedOwnerId
          )
        ) {

          option.selected =
            true;
        }


        select.appendChild(
          option
        );
      }
    );
}


/* ============================================================
   ADD OWNER FIELD TO ANIMAL MODAL
   ============================================================ */

function ensureAnimalOwnerField() {

  const form =
    document.getElementById(
      "animalForm"
    );


  if (!form) {
    return;
  }


  if (
    document.getElementById(
      "animalFormOwner"
    )
  ) {

    return;
  }


  const grid =
    form.querySelector(
      "div[style*='grid-template-columns']"
    );


  if (!grid) {
    return;
  }


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.innerHTML = `

    <label
      style="
        display:block;
        margin-bottom:5px;
        color:var(--navy);
        font-size:8px;
        font-weight:900;
      "
    >
      Owner / Parent
    </label>


    <select
      id="animalFormOwner"
      style="
        width:100%;
        box-sizing:border-box;
        padding:10px 11px;
        border:0;
        outline:none;
        border-radius:11px;
        background:var(--surface);
        color:var(--text);
        box-shadow:var(--shadow-inset);
      "
    >

      <option value="">
        No owner assigned
      </option>

    </select>

  `;


  const firstRow =
    grid.children[
      0
    ];


  if (
    firstRow &&
    firstRow.parentNode
  ) {

    firstRow.parentNode.insertBefore(
      wrapper,
      firstRow
    );

  } else {

    grid.appendChild(
      wrapper
    );
  }


  populateAnimalOwnerDropdown();
}


/* ============================================================
   EXTEND ANIMAL MODAL
   ============================================================ */

const originalGetAnimalModal =
  getAnimalModal;


getAnimalModal =
  function () {

    const modal =
      originalGetAnimalModal();


    ensureAnimalOwnerField();


    return modal;
  };


/* ============================================================
   EXTEND OPEN EDIT ANIMAL
   ============================================================ */

const originalOpenEditAnimal =
  openEditAnimal;


openEditAnimal =
  function (
    animalId
  ) {

    originalOpenEditAnimal(
      animalId
    );


    const animal =
      animalsCache.find(
        item =>
          item.id ===
          animalId
      );


    if (!animal) {
      return;
    }


    populateAnimalOwnerDropdown(
      animal.owner_id ||
      ""
    );
  };


/* ============================================================
   EXTEND OPEN ADD ANIMAL
   ============================================================ */

const originalOpenAddAnimal =
  openAddAnimal;


openAddAnimal =
  function () {

    originalOpenAddAnimal();


    populateAnimalOwnerDropdown(
      ""
    );
  };


/* ============================================================
   EXTEND SAVE ANIMAL
   ============================================================ */

const originalSaveAnimal =
  saveAnimal;


saveAnimal =
  async function (
    event
  ) {

    const ownerField =
      document.getElementById(
        "animalFormOwner"
      );


    if (
      ownerField
    ) {

      const ownerId =
        ownerField.value ||
        null;


      const originalFrom =
        supabaseClient
          .from;


      /*
       * The original save function already
       * handles validation, photo upload,
       * insert and update.
       *
       * We temporarily intercept the
       * selected owner through a hidden
       * data attribute so the original
       * workflow remains intact.
       */

      document
        .getElementById(
          "animalForm"
        )
        ?.setAttribute(
          "data-selected-owner",
          ownerId || ""
        );
    }


    return originalSaveAnimal(
      event
    );
  };


/* ============================================================
   OWNER ASSIGNMENT AFTER SAVE
   ============================================================ */

async function applySelectedOwnerToAnimal(
  animalId
) {

  const form =
    document.getElementById(
      "animalForm"
    );


  if (!form || !animalId) {
    return;
  }


  const ownerId =
    form.getAttribute(
      "data-selected-owner"
    ) || null;


  const {
    error
  } =
    await supabaseClient
      .from(
        "animals"
      )
      .update({
        owner_id:
          ownerId
      })
      .eq(
        "id",
        animalId
      );


  if (error) {

    console.error(
      "Owner assignment error:",
      error
    );


    throw error;
  }
}


/* ============================================================
   ANIMAL OWNER DISPLAY
   ============================================================ */

function getAnimalOwner(
  animal
) {

  if (
    !animal ||
    !animal.owner_id
  ) {

    return null;
  }


  return ownersCache.find(
    owner =>
      owner.id ===
      animal.owner_id
  ) || null;
}


/* ============================================================
   ENHANCED ANIMAL CARD OWNER INFO
   ============================================================ */

function getOwnerDisplayHtml(
  animal
) {

  const owner =
    getAnimalOwner(
      animal
    );


  if (!owner) {

    return `
      <span>
        👤 No owner assigned
      </span>
    `;
  }


  return `
    <span>
      👤 ${escapeHtml(
        owner.name
      )}
    </span>
  `;
}


/* ============================================================
   ANIMAL DETAIL VIEW
   ============================================================ */

function openAnimalDetails(
  animalId
) {

  const animal =
    animalsCache.find(
      item =>
        item.id ===
        animalId
    );


  if (!animal) {

    alert(
      "Animal record could not be found."
    );


    return;
  }


  const owner =
    getAnimalOwner(
      animal
    );


  let modal =
    document.getElementById(
      "animalDetailsModal"
    );


  if (!modal) {

    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "animalDetailsModal";


    document.body.appendChild(
      modal
    );
  }


  modal.innerHTML = `

    <div
      style="
        position:fixed;
        inset:0;
        z-index:11000;
        background:
          rgba(15,35,50,.45);
        backdrop-filter:blur(5px);
      "
      onclick="closeAnimalDetails(event)"
    ></div>


    <div
      style="
        position:fixed;
        inset:0;
        z-index:11001;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        overflow:auto;
        pointer-events:none;
      "
    >

      <div
        style="
          width:min(760px,100%);
          max-height:90vh;
          overflow:auto;
          padding:22px;
          border-radius:24px;
          background:var(--surface);
          box-shadow:
            0 25px 70px
            rgba(15,35,50,.25);
          pointer-events:auto;
        "
        onclick="event.stopPropagation()"
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:12px;
            margin-bottom:18px;
          "
        >

          <div>

            <div
              style="
                color:var(--navy);
                font-size:18px;
                font-weight:900;
              "
            >
              ${escapeHtml(
                animal.name
              )}
            </div>


            <div
              style="
                margin-top:4px;
                color:var(--muted);
                font-size:9px;
                font-weight:700;
              "
            >
              ${escapeHtml(
                animal.animal_id
              )}
            </div>

          </div>


          <button
            type="button"
            onclick="closeAnimalDetails()"
            style="
              width:34px;
              height:34px;
              border:0;
              border-radius:50%;
              background:var(--surface);
              color:var(--navy);
              box-shadow:var(--shadow-soft);
              cursor:pointer;
              font-size:16px;
            "
          >
            ×
          </button>

        </div>


        <div
          style="
            display:grid;
            grid-template-columns:
              170px minmax(0,1fr);
            gap:20px;
          "
        >

          <div>

            <div
              style="
                width:170px;
                height:200px;
                overflow:hidden;
                border-radius:18px;
                background:#dce4e9;
                box-shadow:var(--shadow-inset);
              "
            >

              ${
                animal.photo_url
                  ? `
                    <img
                      src="${escapeHtml(
                        animal.photo_url
                      )}"
                      alt="${escapeHtml(
                        animal.name
                      )}"
                      style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        display:block;
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
                        font-size:42px;
                      "
                    >
                      🐾
                    </div>
                  `
              }

            </div>

          </div>


          <div>

            <div
              style="
                display:grid;
                grid-template-columns:
                  repeat(2,minmax(0,1fr));
                gap:10px;
              "
            >

              ${detailItem(
                "Type",
                animal.type
              )}

              ${detailItem(
                "Breed",
                animal.breed
              )}

              ${detailItem(
                "Gender",
                animal.gender
              )}

              ${detailItem(
                "Date of Birth",
                animal.date_of_birth
              )}

              ${detailItem(
                "Colour",
                animal.colour
              )}

              ${detailItem(
                "Markings",
                animal.markings
              )}

              ${detailItem(
                "Microchip",
                animal.microchip_number
              )}

              ${detailItem(
                "Microchip Provider",
                animal.microchip_provider
              )}

              ${detailItem(
                "Status",
                animal.status
              )}

              ${detailItem(
                "Owner",
                owner?.name ||
                "Not assigned"
              )}

              ${detailItem(
                "City",
                animal.location_city
              )}

              ${detailItem(
                "State",
                animal.location_state
              )}

            </div>

          </div>

        </div>


        <div
          style="
            display:grid;
            gap:12px;
            margin-top:18px;
          "
        >

          ${detailBlock(
            "Identification Notes",
            animal.identification_notes
          )}

          ${detailBlock(
            "Special Instructions",
            animal.special_instructions
          )}

          ${detailBlock(
            "Notes",
            animal.notes
          )}

        </div>


        <div
          style="
            display:flex;
            flex-wrap:wrap;
            gap:8px;
            margin-top:18px;
          "
        >

          <button
            type="button"
            onclick="openEditAnimal('${escapeHtml(
              animal.id
            )}');closeAnimalDetails()"
            style="
              border:0;
              border-radius:10px;
              padding:10px 13px;
              background:
                linear-gradient(
                  135deg,
                  #245579,
                  #173d5d
                );
              color:#fff;
              font-size:8px;
              font-weight:900;
              cursor:pointer;
            "
          >
            EDIT RECORD
          </button>


          <button
            type="button"
            onclick="openAnimalProfile('${escapeHtml(
              animal.id
            )}')"
            style="
              border:0;
              border-radius:10px;
              padding:10px 13px;
              background:var(--surface);
              color:var(--navy);
              box-shadow:var(--shadow-soft);
              font-size:8px;
              font-weight:900;
              cursor:pointer;
            "
          >
            OPEN DIGITAL ID
          </button>

        </div>

      </div>

    </div>
  `;


  modal.style.display =
    "block";
}


/* ============================================================
   DETAIL ITEM
   ============================================================ */

function detailItem(
  label,
  value
) {

  return `
    <div
      style="
        padding:9px 10px;
        border-radius:10px;
        background:
          rgba(36,85,121,.045);
        box-shadow:var(--shadow-inset);
      "
    >

      <div
        style="
          color:var(--muted);
          font-size:7px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:.05em;
        "
      >
        ${escapeHtml(
          label
        )}
      </div>


      <div
        style="
          margin-top:4px;
          color:var(--navy);
          font-size:9px;
          font-weight:800;
          word-break:break-word;
        "
      >
        ${escapeHtml(
          value ||
          "Not specified"
        )}
      </div>

    </div>
  `;
}


/* ============================================================
   DETAIL BLOCK
   ============================================================ */

function detailBlock(
  label,
  value
) {

  if (!value) {
    return "";
  }


  return `
    <div
      style="
        padding:11px 12px;
        border-radius:12px;
        background:
          rgba(36,85,121,.045);
        box-shadow:var(--shadow-inset);
      "
    >

      <div
        style="
          color:var(--muted);
          font-size:7px;
          font-weight:900;
          text-transform:uppercase;
        "
      >
        ${escapeHtml(
          label
        )}
      </div>


      <div
        style="
          margin-top:5px;
          color:var(--text);
          font-size:9px;
          line-height:1.55;
          white-space:pre-wrap;
        "
      >
        ${escapeHtml(
          value
        )}
      </div>

    </div>
  `;
}


/* ============================================================
   CLOSE ANIMAL DETAILS
   ============================================================ */

function closeAnimalDetails(
  event
) {

  if (
    event &&
    event.target !==
      event.currentTarget
  ) {

    return;
  }


  const modal =
    document.getElementById(
      "animalDetailsModal"
    );


  if (modal) {

    modal.style.display =
      "none";
  }
}


/* ============================================================
   ANIMAL CARD DETAILS BUTTON
   ============================================================ */

function addAnimalDetailsButton(
  animal
) {

  return `
    <button
      type="button"
      onclick="openAnimalDetails('${escapeHtml(
        animal.id
      )}')"
      style="
        border:0;
        border-radius:9px;
        padding:8px 11px;
        background:var(--surface);
        color:var(--navy);
        box-shadow:var(--shadow-soft);
        font-size:8px;
        font-weight:900;
        cursor:pointer;
      "
    >
      DETAILS
    </button>
  `;
}


/* ============================================================
   OWNER ASSIGNMENT HELPER
   ============================================================ */

async function assignAnimalOwner(
  animalId,
  ownerId
) {

  if (!animalId) {

    throw new Error(
      "Animal ID is required."
    );
  }


  const {
    error
  } =
    await supabaseClient
      .from(
        "animals"
      )
      .update({
        owner_id:
          ownerId ||
          null
      })
      .eq(
        "id",
        animalId
      );


  if (error) {
    throw error;
  }


  await loadAnimals();


  return true;
}


/* ============================================================
   QUICK OWNER ASSIGNMENT
   ============================================================ */

async function quickAssignOwner(
  animalId
) {

  const animal =
    animalsCache.find(
      item =>
        item.id ===
        animalId
    );


  if (!animal) {
    return;
  }


  if (!ownersCache.length) {

    try {

      await loadOwners();

    } catch (error) {

      console.error(
        "Owner load error:",
        error
      );
    }
  }


  const activeOwners =
    ownersCache.filter(
      owner =>
        owner.is_active !== false
    );


  if (!activeOwners.length) {

    alert(
      "No active owners are available. Please create an owner first."
    );


    return;
  }


  const names =
    activeOwners
      .map(
        (
          owner,
          index
        ) =>
          `${index + 1}. ${owner.name}`
      )
      .join(
        "\n"
      );


  const answer =
    window.prompt(
      `Enter the owner number for ${animal.name}:\n\n${names}`
    );


  if (
    answer ===
    null
  ) {
    return;
  }


  const index =
    Number(
      answer
    ) - 1;


  if (
    !Number.isInteger(
      index
    ) ||
    !activeOwners[index]
  ) {

    alert(
      "Invalid owner selection."
    );


    return;
  }


  try {

    await assignAnimalOwner(
      animalId,
      activeOwners[index].id
    );


    alert(
      `Owner assigned to ${animal.name}.`
    );


  } catch (error) {

    console.error(
      "Quick owner assignment error:",
      error
    );


    alert(
      error?.message ||
      "Unable to assign owner."
    );
  }
}


/* ============================================================
   ANIMAL STATUS HELPERS
   ============================================================ */

async function markAnimalLost(
  animalId
) {

  const animal =
    animalsCache.find(
      item =>
        item.id ===
        animalId
    );


  if (!animal) {
    return;
  }


  const confirmed =
    window.confirm(
      `Mark ${animal.name} as LOST?`
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "animals"
        )
        .update({
          is_lost:
            true
        })
        .eq(
          "id",
          animalId
        );


    if (error) {
      throw error;
    }


    await loadAnimals();


  } catch (error) {

    console.error(
      "Mark lost error:",
      error
    );


    alert(
      error?.message ||
      "Unable to update lost status."
    );
  }
}


async function clearAnimalLost(
  animalId
) {

  const animal =
    animalsCache.find(
      item =>
        item.id ===
        animalId
    );


  if (!animal) {
    return;
  }


  const confirmed =
    window.confirm(
      `Remove LOST status from ${animal.name}?`
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "animals"
        )
        .update({
          is_lost:
            false
        })
        .eq(
          "id",
          animalId
        );


    if (error) {
      throw error;
    }


    await loadAnimals();


  } catch (error) {

    console.error(
      "Clear lost status error:",
      error
    );


    alert(
      error?.message ||
      "Unable to update lost status."
    );
  }
}


/* ============================================================
   PUBLIC VISIBILITY
   ============================================================ */

async function toggleAnimalPublic(
  animalId,
  publicState
) {

  const animal =
    animalsCache.find(
      item =>
        item.id ===
        animalId
    );


  if (!animal) {
    return;
  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "animals"
        )
        .update({
          is_public:
            Boolean(
              publicState
            )
        })
        .eq(
          "id",
          animalId
        );


    if (error) {
      throw error;
    }


    await loadAnimals();


  } catch (error) {

    console.error(
      "Public visibility error:",
      error
    );


    alert(
      error?.message ||
      "Unable to update public visibility."
    );
  }
}


/* ============================================================
   DIGITAL ID URL
   ============================================================ */

function getAnimalDigitalIdUrl(
  animalId
) {

  return (
    "https://sagarjpk.github.io/animal-registry/profile.html?id=" +
    encodeURIComponent(
      animalId
    )
  );
}


/* ============================================================
   COPY DIGITAL ID LINK
   ============================================================ */

async function copyAnimalDigitalId(
  animalId
) {

  const url =
    getAnimalDigitalIdUrl(
      animalId
    );


  try {

    await navigator.clipboard.writeText(
      url
    );


    alert(
      "Digital ID link copied."
    );


  } catch (error) {

    console.error(
      "Copy link error:",
      error
    );


    window.prompt(
      "Copy this Digital ID link:",
      url
    );
  }
}


/* ============================================================
   QR CODE HELPER
   ============================================================ */

function openAnimalQr(
  animalId
) {

  const url =
    getAnimalDigitalIdUrl(
      animalId
    );


  let modal =
    document.getElementById(
      "animalQrModal"
    );


  if (!modal) {

    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "animalQrModal";


    document.body.appendChild(
      modal
    );
  }


  modal.innerHTML = `

    <div
      style="
        position:fixed;
        inset:0;
        z-index:12000;
        background:
          rgba(15,35,50,.45);
        backdrop-filter:blur(5px);
      "
      onclick="closeAnimalQr(event)"
    ></div>


    <div
      style="
        position:fixed;
        inset:0;
        z-index:12001;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        pointer-events:none;
      "
    >

      <div
        style="
          width:min(390px,100%);
          padding:22px;
          border-radius:24px;
          background:var(--surface);
          box-shadow:
            0 25px 70px
            rgba(15,35,50,.25);
          text-align:center;
          pointer-events:auto;
        "
        onclick="event.stopPropagation()"
      >

        <div
          style="
            color:var(--navy);
            font-size:17px;
            font-weight:900;
          "
        >
          Animal Digital ID
        </div>


        <div
          style="
            margin-top:4px;
            color:var(--muted);
            font-size:8px;
          "
        >
          Scan to open the public profile.
        </div>


        <div
          id="animalQrCode"
          style="
            width:220px;
            height:220px;
            margin:18px auto;
            display:grid;
            place-items:center;
            background:#fff;
            border-radius:14px;
            box-shadow:var(--shadow-soft);
          "
        ></div>


        <div
          style="
            color:var(--muted);
            font-size:8px;
            word-break:break-all;
            line-height:1.5;
          "
        >
          ${escapeHtml(
            url
          )}
        </div>


        <div
          style="
            display:flex;
            justify-content:center;
            gap:8px;
            margin-top:15px;
          "
        >

          <button
            type="button"
            onclick="copyAnimalDigitalId('${escapeHtml(
              animalId
            )}')"
            style="
              border:0;
              border-radius:10px;
              padding:9px 12px;
              background:
                linear-gradient(
                  135deg,
                  #245579,
                  #173d5d
                );
              color:#fff;
              font-size:8px;
              font-weight:900;
              cursor:pointer;
            "
          >
            COPY LINK
          </button>


          <button
            type="button"
            onclick="closeAnimalQr()"
            style="
              border:0;
              border-radius:10px;
              padding:9px 12px;
              background:var(--surface);
              color:var(--navy);
              box-shadow:var(--shadow-soft);
              font-size:8px;
              font-weight:900;
              cursor:pointer;
            "
          >
            CLOSE
          </button>

        </div>

      </div>

    </div>
  `;


  modal.style.display =
    "block";


  const qrContainer =
    document.getElementById(
      "animalQrCode"
    );


  if (
    window.QRCode &&
    qrContainer
  ) {

    try {

      new QRCode(
        qrContainer,
        {
          text:
            url,
          width:
            200,
          height:
            200,
          correctLevel:
            QRCode.CorrectLevel.M
        }
      );

    } catch (error) {

      console.error(
        "QR generation error:",
        error
      );


      qrContainer.innerHTML = `
        <div
          style="
            padding:15px;
            color:#a64040;
            font-size:9px;
          "
        >
          Unable to generate QR code.
        </div>
      `;
    }

  } else if (
    qrContainer
  ) {

    qrContainer.innerHTML = `
      <div
        style="
          padding:15px;
          color:#a64040;
          font-size:9px;
        "
      >
        QR library is unavailable.
      </div>
    `;
  }
}


/* ============================================================
   CLOSE QR MODAL
   ============================================================ */

function closeAnimalQr(
  event
) {

  if (
    event &&
    event.target !==
      event.currentTarget
  ) {

    return;
  }


  const modal =
    document.getElementById(
      "animalQrModal"
    );


  if (modal) {

    modal.style.display =
      "none";
  }
}


/* ============================================================
   REGISTRY EXPORT
   ============================================================ */

function csvEscape(
  value
) {

  const stringValue =
    String(
      value ?? ""
    );


  if (
    stringValue.includes(
      ","
    ) ||
    stringValue.includes(
      '"'
    ) ||
    stringValue.includes(
      "\n"
    )
  ) {

    return (
      '"' +
      stringValue.replace(
        /"/g,
        '""'
      ) +
      '"'
    );
  }


  return stringValue;
}


function exportAnimalsCsv() {

  if (
    !animalsCache.length
  ) {

    alert(
      "There are no animal records to export."
    );


    return;
  }


  const headers = [

    "Animal ID",
    "Name",
    "Type",
    "Breed",
    "Gender",
    "Date of Birth",
    "Colour",
    "Markings",
    "Microchip Number",
    "Microchip Provider",
    "Government Reference",
    "Status",
    "Public",
    "Lost",
    "Owner",
    "City",
    "State",
    "Country",
    "Map URL",
    "Registration Date"

  ];


  const rows =
    animalsCache.map(
      animal => {

        const owner =
          getAnimalOwner(
            animal
          );


        return [

          animal.animal_id,
          animal.name,
          animal.type,
          animal.breed,
          animal.gender,
          animal.date_of_birth,
          animal.colour,
          animal.markings,
          animal.microchip_number,
          animal.microchip_provider,
          animal.government_reference,
          animal.status,
          animal.is_public
            ? "Yes"
            : "No",
          animal.is_lost
            ? "Yes"
            : "No",
          owner?.name ||
            "",
          animal.location_city,
          animal.location_state,
          animal.location_country,
          animal.map_url,
          animal.registration_date

        ];
      }
    );


  const csv = [

    headers,

    ...rows

  ]
    .map(
      row =>
        row
          .map(
            csvEscape
          )
          .join(",")
    )
    .join(
      "\r\n"
    );


  const blob =
    new Blob(
      [
        "\uFEFF",
        csv
      ],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    url;


  link.download =
    `animal-registry-${new Date()
      .toISOString()
      .slice(
        0,
        10
      )}.csv`;


  document.body.appendChild(
    link
  );


  link.click();


  link.remove();


  URL.revokeObjectURL(
    url
  );
}


/* ============================================================
   ADMIN ACTIVITY MESSAGE
   ============================================================ */

function showAdminToast(
  message,
  type = "success"
) {

  let toast =
    document.getElementById(
      "adminToast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );


    toast.id =
      "adminToast";


    toast.style.cssText = `
      position:fixed;
      right:18px;
      bottom:18px;
      z-index:15000;
      max-width:340px;
      padding:12px 15px;
      border-radius:13px;
      color:#fff;
      font-size:9px;
      font-weight:800;
      line-height:1.45;
      box-shadow:
        0 12px 30px
        rgba(15,35,50,.22);
      transform:translateY(15px);
      opacity:0;
      transition:
        opacity .2s ease,
        transform .2s ease;
    `;


    document.body.appendChild(
      toast
    );
  }


  toast.style.background =
    type === "error"
      ? "#a64040"
      : "#287651";


  toast.textContent =
    message;


  requestAnimationFrame(
    () => {

      toast.style.opacity =
        "1";

      toast.style.transform =
        "translateY(0)";
    }
  );


  clearTimeout(
    toast._timer
  );


  toast._timer =
    setTimeout(
      () => {

        toast.style.opacity =
          "0";

        toast.style.transform =
          "translateY(15px)";

      },
      3000
    );
}


/* ============================================================
   ADMIN CONFIRMATION HELPER
   ============================================================ */

function adminConfirm(
  message
) {

  return window.confirm(
    message
  );
}


/* ============================================================
   KEYBOARD SHORTCUTS
   ============================================================ */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.ctrlKey &&
      event.key.toLowerCase() ===
        "k"
    ) {

      if (
        animalSearch
      ) {

        event.preventDefault();

        animalSearch.focus();

        animalSearch.select();
      }
    }


    if (
      event.ctrlKey &&
      event.key.toLowerCase() ===
        "n"
    ) {

      event.preventDefault();

      openAddAnimal();
    }


    if (
      event.ctrlKey &&
      event.shiftKey &&
      event.key.toLowerCase() ===
        "o"
    ) {

      event.preventDefault();

      openAddOwner();
    }
  }
);


/* ============================================================
   GLOBAL FUNCTION EXPORTS
   ============================================================ */

window.openAnimalDetails =
  openAnimalDetails;

window.closeAnimalDetails =
  closeAnimalDetails;

window.assignAnimalOwner =
  assignAnimalOwner;

window.quickAssignOwner =
  quickAssignOwner;

window.markAnimalLost =
  markAnimalLost;

window.clearAnimalLost =
  clearAnimalLost;

window.toggleAnimalPublic =
  toggleAnimalPublic;

window.getAnimalDigitalIdUrl =
  getAnimalDigitalIdUrl;

window.copyAnimalDigitalId =
  copyAnimalDigitalId;

window.openAnimalQr =
  openAnimalQr;

window.closeAnimalQr =
  closeAnimalQr;

window.exportAnimalsCsv =
  exportAnimalsCsv;

window.showAdminToast =
  showAdminToast;


/* ============================================================
   PART 4 COMPLETE
   ============================================================ */
   /* ============================================================
   PART 5
   CHANGE REQUEST ADMINISTRATION
   ============================================================ */


/* ============================================================
   CHANGE REQUEST HELPERS
   ============================================================ */

function formatFileSize(
  bytes
) {

  const size =
    Number(
      bytes
    ) || 0;


  if (size <= 0) {
    return "";
  }


  if (size < 1024) {
    return `${size} B`;
  }


  if (
    size <
    1024 * 1024
  ) {

    return `${(
      size / 1024
    ).toFixed(1)} KB`;
  }


  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}


/* ============================================================
   CHANGE REQUEST ATTACHMENT
   ============================================================ */

function isSupportedChangeRequestFile(
  file
) {

  if (!file) {
    return false;
  }


  const allowedTypes = [

    "application/pdf",

    "image/jpeg",

    "image/png"

  ];


  return allowedTypes.includes(
    file.type
  );
}


/* ============================================================
   OPEN ATTACHMENT
   ============================================================ */

async function openChangeRequestAttachment(
  request
) {

  if (
    !request ||
    !request.attachment_path
  ) {

    alert(
      "No attachment is available for this request."
    );


    return;
  }


  try {

    const button =
      document.querySelector(
        `[data-attachment-request="${request.id}"]`
      );


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "OPENING...";
    }


    const {
      data,
      error
    } =
      await supabaseClient.storage
        .from(
          request.attachment_storage ||
          "change-request-attachments"
        )
        .createSignedUrl(
          request.attachment_path,
          1800
        );


    if (error) {
      throw error;
    }


    const signedUrl =
      data?.signedUrl;


    if (!signedUrl) {

      throw new Error(
        "Unable to create a secure attachment link."
      );
    }


    window.open(
      signedUrl,
      "_blank",
      "noopener,noreferrer"
    );


  } catch (error) {

    console.error(
      "Open attachment error:",
      error
    );


    alert(
      error?.message ||
      "Unable to open the attachment."
    );


  } finally {

    const button =
      document.querySelector(
        `[data-attachment-request="${request?.id}"]`
      );


    if (button) {

      button.disabled =
        false;

      button.textContent =
        "📎 OPEN DOCUMENT";
    }
  }
}


/* ============================================================
   CHANGE REQUEST DETAILS
   ============================================================ */

function showChangeRequestDetails(
  requestId
) {

  const request =
    changeRequestsCache.find(
      item =>
        item.id ===
        requestId
    );


  if (!request) {

    alert(
      "Change request could not be found."
    );


    return;
  }


  let modal =
    document.getElementById(
      "changeRequestDetailsModal"
    );


  if (!modal) {

    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "changeRequestDetailsModal";


    document.body.appendChild(
      modal
    );
  }


  const animal =
    animalsCache.find(
      item =>
        item.id ===
          request.animal_uuid ||
        item.animal_id ===
          request.animal_id
    );


  const profileUrl =
    request.animal_uuid
      ? getAnimalDigitalIdUrl(
          request.animal_uuid
        )
      : "";


  modal.innerHTML = `

    <div
      style="
        position:fixed;
        inset:0;
        z-index:13000;
        background:
          rgba(15,35,50,.45);
        backdrop-filter:blur(5px);
      "
      onclick="closeChangeRequestDetails(event)"
    ></div>


    <div
      style="
        position:fixed;
        inset:0;
        z-index:13001;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        overflow:auto;
        pointer-events:none;
      "
    >

      <div
        style="
          width:min(650px,100%);
          max-height:90vh;
          overflow:auto;
          padding:22px;
          border-radius:24px;
          background:var(--surface);
          box-shadow:
            0 25px 70px
            rgba(15,35,50,.25);
          pointer-events:auto;
        "
        onclick="event.stopPropagation()"
      >

        <div
          style="
            display:flex;
            align-items:flex-start;
            justify-content:space-between;
            gap:12px;
          "
        >

          <div>

            <div
              style="
                color:var(--navy);
                font-size:18px;
                font-weight:900;
              "
            >
              Change Request
            </div>


            <div
              style="
                margin-top:4px;
                color:var(--muted);
                font-size:9px;
              "
            >
              ${escapeHtml(
                request.change_type ||
                "Registry change"
              )}
            </div>

          </div>


          <button
            type="button"
            onclick="closeChangeRequestDetails()"
            style="
              width:34px;
              height:34px;
              border:0;
              border-radius:50%;
              background:var(--surface);
              color:var(--navy);
              box-shadow:var(--shadow-soft);
              cursor:pointer;
              font-size:16px;
            "
          >
            ×
          </button>

        </div>


        <div
          style="
            display:grid;
            gap:11px;
            margin-top:18px;
          "
        >

          ${detailBlock(
            "Animal",
            `${request.animal_name || "Unknown"}${
              request.animal_id
                ? ` • ${request.animal_id}`
                : ""
            }`
          )}


          ${detailBlock(
            "Requester",
            `${request.requester_name || "Unknown"}${
              request.requester_email
                ? ` • ${request.requester_email}`
                : ""
            }`
          )}


          ${detailBlock(
            "Submitted",
            formatChangeRequestDate(
              request.created_at
            )
          )}


          ${detailBlock(
            "Message",
            request.message
          )}


          ${
            request.attachment_name
              ? detailBlock(
                  "Attachment",
                  `${request.attachment_name}${
                    request.attachment_size
                      ? ` • ${formatFileSize(
                          request.attachment_size
                        )}`
                      : ""
                  }`
                )
              : ""
          }

        </div>


        <div
          style="
            display:flex;
            flex-wrap:wrap;
            gap:8px;
            margin-top:18px;
          "
        >

          ${
            profileUrl
              ? `
                <button
                  type="button"
                  onclick="window.open(
                    '${escapeHtml(
                      profileUrl
                    )}',
                    '_blank',
                    'noopener,noreferrer'
                  )"
                  style="
                    border:0;
                    border-radius:10px;
                    padding:10px 13px;
                    background:
                      linear-gradient(
                        135deg,
                        #245579,
                        #173d5d
                      );
                    color:#fff;
                    font-size:8px;
                    font-weight:900;
                    cursor:pointer;
                  "
                >
                  VIEW DIGITAL ID
                </button>
              `
              : ""
          }


          ${
            request.attachment_path
              ? `
                <button
                  type="button"
                  onclick="openChangeRequestAttachment(
                    changeRequestsCache.find(
                      item =>
                        item.id ===
                        '${escapeHtml(
                          request.id
                        )}'
                    )
                  )"
                  style="
                    border:0;
                    border-radius:10px;
                    padding:10px 13px;
                    background:var(--surface);
                    color:var(--navy);
                    box-shadow:var(--shadow-soft);
                    font-size:8px;
                    font-weight:900;
                    cursor:pointer;
                  "
                >
                  📎 OPEN DOCUMENT
                </button>
              `
              : ""
          }


          <button
            type="button"
            onclick="closeChangeRequestDetails();updateChangeRequestStatus(
              '${escapeHtml(
                request.id
              )}',
              'REVIEWED'
            )"
            style="
              border:0;
              border-radius:10px;
              padding:10px 13px;
              background:
                rgba(45,138,98,.10);
              color:#287651;
              font-size:8px;
              font-weight:900;
              cursor:pointer;
            "
          >
            ✓ MARK REVIEWED
          </button>


          <button
            type="button"
            onclick="closeChangeRequestDetails();updateChangeRequestStatus(
              '${escapeHtml(
                request.id
              )}',
              'REJECTED'
            )"
            style="
              border:0;
              border-radius:10px;
              padding:10px 13px;
              background:
                rgba(184,76,76,.10);
              color:#a64040;
              font-size:8px;
              font-weight:900;
              cursor:pointer;
            "
          >
            REJECT
          </button>

        </div>

      </div>

    </div>
  `;


  modal.style.display =
    "block";
}


/* ============================================================
   CLOSE CHANGE REQUEST DETAILS
   ============================================================ */

function closeChangeRequestDetails(
  event
) {

  if (
    event &&
    event.target !==
      event.currentTarget
  ) {

    return;
  }


  const modal =
    document.getElementById(
      "changeRequestDetailsModal"
    );


  if (modal) {

    modal.style.display =
      "none";
  }
}


/* ============================================================
   REQUEST STATUS LABEL
   ============================================================ */

function getChangeRequestStatusLabel(
  status
) {

  switch (
    String(
      status ||
      ""
    ).toUpperCase()
  ) {

    case "PENDING":
      return "PENDING";

    case "REVIEWED":
      return "REVIEWED";

    case "REJECTED":
      return "REJECTED";

    default:
      return (
        status ||
        "UNKNOWN"
      );
  }
}


/* ============================================================
   REQUEST STATUS COLOR
   ============================================================ */

function getChangeRequestStatusColor(
  status
) {

  switch (
    String(
      status ||
      ""
    ).toUpperCase()
  ) {

    case "REVIEWED":
      return "#287651";

    case "REJECTED":
      return "#a64040";

    default:
      return "#a53a48";
  }
}


/* ============================================================
   CHANGE REQUEST HISTORY
   ============================================================ */

async function loadChangeRequestHistory() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "change_requests"
      )
      .select(
        `
          id,
          animal_id,
          animal_uuid,
          animal_name,
          requester_name,
          requester_email,
          change_type,
          message,
          attachment_name,
          attachment_type,
          attachment_size,
          attachment_path,
          attachment_storage,
          status,
          created_at,
          reviewed_at,
          reviewed_by
        `
      )
      .order(
        "created_at",
        {
          ascending:
            false
        }
      )
      .limit(
        100
      );


  if (error) {

    console.error(
      "Change request history error:",
      error
    );


    throw error;
  }


  return data || [];
}


/* ============================================================
   CHANGE REQUEST HISTORY PANEL
   ============================================================ */

async function showChangeRequestHistory() {

  let modal =
    document.getElementById(
      "changeRequestHistoryModal"
    );


  if (!modal) {

    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "changeRequestHistoryModal";


    document.body.appendChild(
      modal
    );
  }


  modal.innerHTML = `

    <div
      style="
        position:fixed;
        inset:0;
        z-index:14000;
        background:
          rgba(15,35,50,.45);
        backdrop-filter:blur(5px);
      "
      onclick="closeChangeRequestHistory(event)"
    ></div>


    <div
      style="
        position:fixed;
        inset:0;
        z-index:14001;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        overflow:auto;
        pointer-events:none;
      "
    >

      <div
        style="
          width:min(900px,100%);
          max-height:90vh;
          overflow:auto;
          padding:22px;
          border-radius:24px;
          background:var(--surface);
          box-shadow:
            0 25px 70px
            rgba(15,35,50,.25);
          pointer-events:auto;
        "
        onclick="event.stopPropagation()"
      >

        <div
          style="
            display:flex;
            align-items:flex-start;
            justify-content:space-between;
            gap:12px;
          "
        >

          <div>

            <div
              style="
                color:var(--navy);
                font-size:18px;
                font-weight:900;
              "
            >
              Change Request History
            </div>


            <div
              style="
                margin-top:4px;
                color:var(--muted);
                font-size:9px;
              "
            >
              Recently submitted and processed requests.
            </div>

          </div>


          <button
            type="button"
            onclick="closeChangeRequestHistory()"
            style="
              width:34px;
              height:34px;
              border:0;
              border-radius:50%;
              background:var(--surface);
              color:var(--navy);
              box-shadow:var(--shadow-soft);
              cursor:pointer;
              font-size:16px;
            "
          >
            ×
          </button>

        </div>


        <div
          id="changeRequestHistoryList"
          style="
            margin-top:17px;
          "
        >
          Loading history...
        </div>

      </div>

    </div>
  `;


  modal.style.display =
    "block";


  const list =
    document.getElementById(
      "changeRequestHistoryList"
    );


  try {

    const requests =
      await loadChangeRequestHistory();


    if (
      !requests.length
    ) {

      list.innerHTML = `
        <div
          style="
            padding:20px;
            text-align:center;
            color:var(--muted);
            font-size:9px;
          "
        >
          No change request history found.
        </div>
      `;


      return;
    }


    list.innerHTML =
      requests
        .map(
          request => `

            <div
              style="
                padding:13px;
                margin-bottom:10px;
                border-radius:14px;
                background:
                  rgba(36,85,121,.045);
                box-shadow:var(--shadow-inset);
              "
            >

              <div
                style="
                  display:flex;
                  justify-content:space-between;
                  align-items:flex-start;
                  gap:10px;
                  flex-wrap:wrap;
                "
              >

                <div>

                  <div
                    style="
                      color:var(--navy);
                      font-size:11px;
                      font-weight:900;
                    "
                  >
                    ${escapeHtml(
                      request.animal_name ||
                      "Unknown animal"
                    )}
                  </div>


                  <div
                    style="
                      margin-top:3px;
                      color:var(--muted);
                      font-size:8px;
                    "
                  >
                    ${escapeHtml(
                      request.animal_id ||
                      ""
                    )}
                  </div>

                </div>


                <span
                  style="
                    display:inline-flex;
                    padding:4px 8px;
                    border-radius:999px;
                    background:
                      ${getChangeRequestStatusColor(
                        request.status
                      )}18;
                    color:
                      ${getChangeRequestStatusColor(
                        request.status
                      )};
                    font-size:7px;
                    font-weight:900;
                  "
                >
                  ${escapeHtml(
                    getChangeRequestStatusLabel(
                      request.status
                    )
                  )}
                </span>

              </div>


              <div
                style="
                  display:flex;
                  flex-wrap:wrap;
                  gap:8px 14px;
                  margin-top:8px;
                  color:var(--muted);
                  font-size:8px;
                "
              >

                <span>
                  👤 ${escapeHtml(
                    request.requester_name
                  )}
                </span>

                <span>
                  📝 ${escapeHtml(
                    request.change_type
                  )}
                </span>

                <span>
                  🕒 ${escapeHtml(
                    formatChangeRequestDate(
                      request.created_at
                    )
                  )}
                </span>

              </div>


              <div
                style="
                  margin-top:8px;
                  color:var(--text);
                  font-size:9px;
                  line-height:1.5;
                "
              >
                ${escapeHtml(
                  request.message
                )}
              </div>


              ${
                request.reviewed_at
                  ? `
                    <div
                      style="
                        margin-top:8px;
                        color:var(--muted);
                        font-size:8px;
                      "
                    >
                      Processed:
                      ${escapeHtml(
                        formatChangeRequestDate(
                          request.reviewed_at
                        )
                      )}
                    </div>
                  `
                  : ""
              }

            </div>

          `
        )
        .join("");


  } catch (error) {

    console.error(
      "History rendering error:",
      error
    );


    list.innerHTML = `
      <div
        style="
          padding:15px;
          color:#a64040;
          background:
            rgba(184,76,76,.08);
          border-radius:12px;
          font-size:9px;
        "
      >
        ${escapeHtml(
          error?.message ||
          "Unable to load change request history."
        )}
      </div>
    `;
  }
}


/* ============================================================
   CLOSE CHANGE REQUEST HISTORY
   ============================================================ */

function closeChangeRequestHistory(
  event
) {

  if (
    event &&
    event.target !==
      event.currentTarget
  ) {

    return;
  }


  const modal =
    document.getElementById(
      "changeRequestHistoryModal"
    );


  if (modal) {

    modal.style.display =
      "none";
  }
}


/* ============================================================
   CHANGE REQUEST COUNT HELPERS
   ============================================================ */

async function getPendingChangeRequestCount() {

  const {
    count,
    error
  } =
    await supabaseClient
      .from(
        "change_requests"
      )
      .select(
        "id",
        {
          count:
            "exact",
          head:
            true
        }
      )
      .eq(
        "status",
        "PENDING"
      );


  if (error) {

    console.error(
      "Pending change request count error:",
      error
    );


    return 0;
  }


  return count || 0;
}


/* ============================================================
   PERIODIC CHANGE REQUEST REFRESH
   ============================================================ */

let changeRequestRefreshTimer =
  null;


function startChangeRequestRefresh() {

  if (
    changeRequestRefreshTimer
  ) {

    clearInterval(
      changeRequestRefreshTimer
    );
  }


  changeRequestRefreshTimer =
    setInterval(
      async () => {

        if (
          !currentUser ||
          !currentAdmin
        ) {

          return;
        }


        try {

          await loadChangeRequests();

        } catch (error) {

          console.error(
            "Automatic change request refresh error:",
            error
          );
        }

      },
      60000
    );
}


function stopChangeRequestRefresh() {

  if (
    changeRequestRefreshTimer
  ) {

    clearInterval(
      changeRequestRefreshTimer
    );


    changeRequestRefreshTimer =
      null;
  }
}


/* ============================================================
   CHANGE REQUEST NOTIFICATION CHECK
   ============================================================ */

async function checkChangeRequestNotification() {

  if (
    !currentUser ||
    !currentAdmin
  ) {

    return;
  }


  try {

    const count =
      await getPendingChangeRequestCount();


    updateChangeRequestNotification(
      count
    );


  } catch (error) {

    console.error(
      "Change request notification error:",
      error
    );
  }
}


/* ============================================================
   ADMIN DASHBOARD REQUEST BUTTON
   ============================================================ */

function createChangeRequestHistoryButton() {

  const panel =
    document.getElementById(
      "changeRequestPanel"
    );


  if (!panel) {
    return;
  }


  if (
    document.getElementById(
      "changeRequestHistoryButton"
    )
  ) {

    return;
  }


  const header =
    panel.querySelector(
      ".change-request-panel-header"
    );


  if (!header) {
    return;
  }


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "changeRequestHistoryButton";


  button.type =
    "button";


  button.className =
    "change-request-refresh";


  button.textContent =
    "History";


  button.onclick =
    showChangeRequestHistory;


  const refreshButton =
    header.querySelector(
      ".change-request-refresh"
    );


  if (
    refreshButton
  ) {

    refreshButton.insertAdjacentElement(
      "afterend",
      button
    );

  } else {

    header.appendChild(
      button
    );
  }
}


/* ============================================================
   ENHANCE CHANGE REQUEST PANEL
   ============================================================ */

function enhanceChangeRequestPanel() {

  ensureChangeRequestPanel();

  createChangeRequestHistoryButton();
}


/* ============================================================
   CHANGE REQUEST INITIALIZATION
   ============================================================ */

function initializeChangeRequestManagement() {

  try {

    ensureChangeRequestPanel();

    createChangeRequestHistoryButton();

    startChangeRequestRefresh();

  } catch (error) {

    console.error(
      "Change request initialization error:",
      error
    );
  }
}


/* ============================================================
   AUTHENTICATION REFRESH HOOK
   ============================================================ */

const originalShowAdminApp =
  showAdminApp;


showAdminApp =
  function () {

    originalShowAdminApp();


    setTimeout(
      () => {

        initializeOwnerManagement();

        initializeChangeRequestManagement();

      },
      100
    );
  };


/* ============================================================
   DASHBOARD REFRESH HOOK
   ============================================================ */

const originalRefreshAdminDashboard =
  refreshAdminDashboard;


refreshAdminDashboard =
  async function () {

    await originalRefreshAdminDashboard();


    enhanceChangeRequestPanel();

  };


/* ============================================================
   CHANGE REQUEST GLOBAL FUNCTIONS
   ============================================================ */

window.openChangeRequestAttachment =
  openChangeRequestAttachment;

window.showChangeRequestDetails =
  showChangeRequestDetails;

window.closeChangeRequestDetails =
  closeChangeRequestDetails;

window.loadChangeRequestHistory =
  loadChangeRequestHistory;

window.showChangeRequestHistory =
  showChangeRequestHistory;

window.closeChangeRequestHistory =
  closeChangeRequestHistory;

window.getPendingChangeRequestCount =
  getPendingChangeRequestCount;

window.checkChangeRequestNotification =
  checkChangeRequestNotification;

window.initializeChangeRequestManagement =
  initializeChangeRequestManagement;


/* ============================================================
   OWNER GLOBAL FUNCTIONS
   ============================================================ */

window.populateAnimalOwnerDropdown =
  populateAnimalOwnerDropdown;

window.getAnimalOwner =
  getAnimalOwner;

window.getOwnerDisplayHtml =
  getOwnerDisplayHtml;


/* ============================================================
   START BACKGROUND REFRESH
   ============================================================ */

setTimeout(
  () => {

    if (
      currentUser &&
      currentAdmin
    ) {

      startChangeRequestRefresh();

    }

  },
  2000
);


/* ============================================================
   WINDOW CLEANUP
   ============================================================ */

window.addEventListener(
  "beforeunload",
  () => {

    stopChangeRequestRefresh();

  }
);


/* ============================================================
   PART 5 COMPLETE
   ============================================================ */
   /* ============================================================
   PART 6
   FINAL INITIALIZATION + SAFETY CHECKS
   ============================================================ */


/* ============================================================
   FINAL UI INITIALIZATION
   ============================================================ */

function initializeFinalAdminUi() {

  try {

    ensureOwnerManagementPanel();

  } catch (error) {

    console.error(
      "Owner UI initialization error:",
      error
    );
  }


  try {

    ensureChangeRequestPanel();

    createChangeRequestHistoryButton();

  } catch (error) {

    console.error(
      "Change request UI initialization error:",
      error
    );
  }
}


/* ============================================================
   ADMIN SESSION CHECK
   ============================================================ */

async function verifyCurrentAdminSession() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .getSession();


    if (error) {
      throw error;
    }


    if (
      !data?.session?.user
    ) {

      showLogin();

      return false;
    }


    currentUser =
      data.session.user;


    currentAdmin =
      await getAdminProfile(
        currentUser.id
      );


    updateAdminHeader();


    return true;


  } catch (error) {

    console.error(
      "Session verification error:",
      error
    );


    currentUser =
      null;

    currentAdmin =
      null;


    try {

      await supabaseClient.auth
        .signOut();

    } catch (
      signOutError
    ) {

      console.error(
        "Sign out error:",
        signOutError
      );
    }


    showLogin();


    showLoginMessage(
      error?.message ||
      "Administrator session could not be verified."
    );


    return false;
  }
}


/* ============================================================
   MANUAL ADMIN SESSION REFRESH
   ============================================================ */

async function refreshAdminSession() {

  const valid =
    await verifyCurrentAdminSession();


  if (!valid) {
    return;
  }


  await loadDashboard();


  initializeFinalAdminUi();
}


/* ============================================================
   SAFE DATABASE ERROR
   ============================================================ */

function getFriendlyDatabaseError(
  error
) {

  if (!error) {

    return "An unknown database error occurred.";
  }


  const message =
    String(
      error.message ||
      error
    );


  if (
    message.includes(
      "relation"
    ) &&
    message.includes(
      "does not exist"
    )
  ) {

    return (
      "The required database table does not exist yet."
    );
  }


  if (
    message.includes(
      "permission denied"
    ) ||
    message.includes(
      "row-level security"
    )
  ) {

    return (
      "Database permissions are preventing this operation."
    );
  }


  if (
    message.includes(
      "JWT"
    ) ||
    message.includes(
      "token"
    )
  ) {

    return (
      "Your administrator session has expired. Please sign in again."
    );
  }


  return message;
}


/* ============================================================
   SAFE ALERT
   ============================================================ */

function safeAlert(
  message
) {

  try {

    alert(
      message
    );

  } catch (error) {

    console.error(
      "Alert error:",
      error
    );
  }
}


/* ============================================================
   DATABASE CONNECTION TEST
   ============================================================ */

async function testAdminDatabaseConnection() {

  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "animals"
        )
        .select(
          "id",
          {
            count:
              "exact",
            head:
              true
          }
        );


    if (error) {
      throw error;
    }


    return {
      success:
        true,
      message:
        "Database connection is working."
    };


  } catch (error) {

    console.error(
      "Database connection test error:",
      error
    );


    return {
      success:
        false,
      message:
        getFriendlyDatabaseError(
          error
        )
    };
  }
}


/* ============================================================
   ADMIN HEALTH CHECK
   ============================================================ */

async function runAdminHealthCheck() {

  const results = [];


  results.push({
    name:
      "Authentication",
    success:
      Boolean(
        currentUser &&
        currentAdmin
      )
  });


  const database =
    await testAdminDatabaseConnection();


  results.push({
    name:
      "Animal Database",
    success:
      database.success
  });


  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "change_requests"
        )
        .select(
          "id",
          {
            count:
              "exact",
            head:
              true
          }
        );


    results.push({
      name:
        "Change Requests",
      success:
        !error
    });


  } catch (error) {

    results.push({
      name:
        "Change Requests",
      success:
        false
    });
  }


  return results;
}


/* ============================================================
   HEALTH CHECK UI
   ============================================================ */

async function showAdminHealthCheck() {

  const results =
    await runAdminHealthCheck();


  const failed =
    results.filter(
      result =>
        !result.success
    );


  const lines =
    results
      .map(
        result =>
          `${result.success ? "✓" : "✕"} ${result.name}`
      )
      .join(
        "\n"
      );


  safeAlert(
    `Animal Digital ID Admin Health Check\n\n${lines}\n\n${
      failed.length
        ? "Some checks need attention."
        : "Everything is working."
    }`
  );
}


/* ============================================================
   ADMIN USER INFORMATION
   ============================================================ */

function getCurrentAdminInfo() {

  return {

    userId:
      currentUser?.id ||
      null,

    email:
      currentAdmin?.email ||
      currentUser?.email ||
      null,

    name:
      currentAdmin?.full_name ||
      null,

    role:
      currentAdmin?.role ||
      null

  };
}


/* ============================================================
   REQUEST TABLE DIAGNOSTICS
   ============================================================ */

async function checkChangeRequestTable() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "change_requests"
        )
        .select(
          "id,status,created_at"
        )
        .limit(
          1
        );


    if (error) {
      throw error;
    }


    return {
      exists:
        true,
      accessible:
        true,
      data
    };


  } catch (error) {

    console.error(
      "Change request table check error:",
      error
    );


    return {
      exists:
        false,
      accessible:
        false,
      error:
        error.message
    };
  }
}


/* ============================================================
   STORAGE DIAGNOSTICS
   ============================================================ */

async function checkChangeRequestStorage() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient.storage
        .from(
          "change-request-attachments"
        )
        .list(
          "",
          {
            limit:
              1
          }
        );


    if (error) {
      throw error;
    }


    return {
      accessible:
        true,
      data
    };


  } catch (error) {

    console.error(
      "Change request storage check error:",
      error
    );


    return {
      accessible:
        false,
      error:
        error.message
    };
  }
}


/* ============================================================
   CHANGE REQUEST SYSTEM CHECK
   ============================================================ */

async function checkChangeRequestSystem() {

  const table =
    await checkChangeRequestTable();


  const storage =
    await checkChangeRequestStorage();


  const message = [

    "Change Request System Check",
    "",

    `Database table: ${
      table.accessible
        ? "✓ Accessible"
        : "✕ Not accessible"
    }`,

    `Attachment storage: ${
      storage.accessible
        ? "✓ Accessible"
        : "✕ Not accessible"
    }`

  ].join(
    "\n"
  );


  safeAlert(
    message
  );
}


/* ============================================================
   ADMIN CONSOLE COMMANDS
   ============================================================ */

window.refreshAdminSession =
  refreshAdminSession;

window.runAdminHealthCheck =
  runAdminHealthCheck;

window.showAdminHealthCheck =
  showAdminHealthCheck;

window.getCurrentAdminInfo =
  getCurrentAdminInfo;

window.checkChangeRequestTable =
  checkChangeRequestTable;

window.checkChangeRequestStorage =
  checkChangeRequestStorage;

window.checkChangeRequestSystem =
  checkChangeRequestSystem;


/* ============================================================
   FINAL MOBILE ADJUSTMENTS
   ============================================================ */

function addAdminMobileStyles() {

  if (
    document.getElementById(
      "adminMobileStyles"
    )
  ) {

    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "adminMobileStyles";


  style.textContent = `

    @media(max-width:600px){

      #animalModalCard{

        padding:16px !important;

        border-radius:20px !important;

      }


      #animalModalCard
      form > div{

        grid-template-columns:
          minmax(0,1fr) !important;

      }


      #animalModalCard
      form > div > div{

        grid-column:
          1 / -1 !important;

      }


      #ownerModal
      input,
      #ownerModal
      textarea,
      #ownerModal
      select{

        font-size:16px !important;

      }


      .change-request-panel{

        padding:13px !important;

        border-radius:16px !important;

      }


      .change-request-panel-header{

        align-items:flex-start !important;

        flex-direction:column !important;

      }


      .change-request-item{

        grid-template-columns:
          46px
          minmax(0,1fr) !important;

      }


      .change-request-actions{

        grid-column:
          1 / -1 !important;

      }

    }

  `;


  document.head.appendChild(
    style
  );
}


/* ============================================================
   FINAL UI START
   ============================================================ */

function startFinalAdminUi() {

  try {

    addAdminMobileStyles();

  } catch (error) {

    console.error(
      "Mobile style error:",
      error
    );
  }


  try {

    initializeFinalAdminUi();

  } catch (error) {

    console.error(
      "Final UI initialization error:",
      error
    );
  }
}


/* ============================================================
   DOM READY
   ============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    startFinalAdminUi,
    {
      once:
        true
    }
  );

} else {

  startFinalAdminUi();
}


/* ============================================================
   FINAL AUTH STATE MONITOR
   ============================================================ */

supabaseClient.auth.onAuthStateChange(
  (
    event,
    session
  ) => {

    if (
      event ===
      "SIGNED_OUT"
    ) {

      stopChangeRequestRefresh();

      currentUser =
        null;

      currentAdmin =
        null;


      return;
    }


    if (
      session?.user &&
      event ===
        "TOKEN_REFRESHED"
    ) {

      currentUser =
        session.user;

    }

  }
);


/* ============================================================
   FINAL ERROR HANDLING
   ============================================================ */

window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "Unhandled admin promise:",
      event.reason
    );
  }
);


window.addEventListener(
  "error",
  event => {

    console.error(
      "Admin runtime error:",
      event.error ||
      event.message
    );
  }
);


/* ============================================================
   FINAL ADMIN.JS MARKER
   ============================================================ */

window.ANIMAL_DIGITAL_ID_ADMIN =
  {
    version:
      "change-request-admin-1.0",

    initialized:
      true,

    features: [

      "Admin Authentication",

      "Animal Management",

      "Owner Management",

      "Animal Photos",

      "Digital ID Links",

      "QR Codes",

      "Animal Search",

      "CSV Export",

      "Lost Status",

      "Public Visibility",

      "Change Requests",

      "Change Request Attachments",

      "Change Request History",

      "Review Requests",

      "Reject Requests"

    ]
  };


/* ============================================================
   ADMIN.JS COMPLETE
   ============================================================ */
