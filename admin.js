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


/* ============================================================
   SUPABASE CLIENT
   ============================================================ */

const {
  createClient
} = window.supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* ============================================================
   DOM ELEMENTS
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
   APPLICATION STATE
   ============================================================ */

let currentUser = null;
let currentAdmin = null;
let animalsCache = [];


/* ============================================================
   MESSAGE HELPERS
   ============================================================ */

function showLoginMessage(message, type = "error") {

  loginMessage.textContent = message;

  if (type === "success") {

    loginMessage.style.color =
      "#2d8a62";

  } else {

    loginMessage.style.color =
      "#b84c4c";
  }
}


function clearLoginMessage() {

  loginMessage.textContent = "";
}


/* ============================================================
   LOGIN BUTTON STATE
   ============================================================ */

function setLoginLoading(isLoading) {

  loginButton.disabled = isLoading;

  loginButton.textContent =
    isLoading
      ? "SIGNING IN..."
      : "SIGN IN";
}


/* ============================================================
   SHOW / HIDE APPLICATION
   ============================================================ */

function showLogin() {

  loginScreen.style.display = "flex";

  adminApp.style.display = "none";
}


function showAdminApp() {

  loginScreen.style.display = "none";

  adminApp.style.display = "block";
}


/* ============================================================
   GET ADMIN PROFILE
   ============================================================ */

async function getAdminProfile(userId) {

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
      "Your administrator account is currently inactive."
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

async function login(email, password) {

  clearLoginMessage();

  setLoginLoading(true);


  try {

    const {
      data,
      error
    } = await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });


    if (error) {

      console.error(
        "Supabase login error:",
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


    currentUser = data.user;


    /*
      Verify that the authenticated user
      is actually registered in admin_users.
    */

    currentAdmin =
      await getAdminProfile(
        currentUser.id
      );


    showLoginMessage(
      "Login successful.",
      "success"
    );


    updateAdminHeader();


    showAdminApp();


    await loadDashboard();


  } catch (error) {

    console.error(
      "Login failed:",
      error
    );


    /*
      If authentication succeeded but
      admin verification failed, sign out.
    */

    if (currentUser && !currentAdmin) {

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
   UPDATE ADMIN HEADER
   ============================================================ */

function updateAdminHeader() {

  if (!currentAdmin) {

    adminUserName.textContent =
      "Administrator";

    adminUserEmail.textContent =
      "—";

    return;
  }


  adminUserName.textContent =
    currentAdmin.full_name ||
    "Administrator";


  adminUserEmail.textContent =
    currentAdmin.email ||
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
      "Dashboard loading error:",
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
          The Admin Center could not retrieve
          the animal records from Supabase.
          Check the browser console for details.
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
  } = await supabaseClient
    .from("animals")
    .select(`
      id,
      animal_id,
      name,
      type,
      breed,
      gender,
      date_of_birth,
      photo_url,
      status,
      is_public,
      is_lost,
      registration_date,
      owner_id,
      location_city,
      location_state,
      location_country,
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
      "Unable to load animals."
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
   ANIMAL STATISTICS
   ============================================================ */

function updateAnimalStats(animals) {

  const total =
    animals.length;


  const active =
    animals.filter(
      animal =>
        animal.status ===
        "ACTIVE RECORD"
    ).length;


  const lost =
    animals.filter(
      animal =>
        animal.is_lost === true
    ).length;


  totalAnimals.textContent =
    String(total);


  activeAnimals.textContent =
    String(active);


  lostAnimals.textContent =
    String(lost);
}


/* ============================================================
   CHANGE REQUESTS
   ============================================================ */

async function loadChangeRequests() {

  const {
    count,
    error
  } = await supabaseClient
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

    /*
      Do not prevent the entire dashboard
      from loading if this counter fails.
    */

    changeRequests.textContent =
      "0";

    return;
  }


  changeRequests.textContent =
    String(count || 0);
}


/* ============================================================
   SEARCH
   ============================================================ */

function searchAnimals(query) {

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
   ESCAPE HTML
   ============================================================ */

function escapeHtml(value) {

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
   RENDER ANIMALS
   ============================================================ */

function renderAnimals(animals) {

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

      ${animals.map(
        animal => renderAnimalCard(animal)
      ).join("")}

    </div>

  `;
}


/* ============================================================
   ANIMAL CARD
   ============================================================ */

function renderAnimalCard(animal) {

  const photo =
    animal.photo_url ||
    "";


  const location = [
    animal.location_city,
    animal.location_state
  ]
    .filter(Boolean)
    .join(", ");


  const statusClass =
    animal.status ===
    "ACTIVE RECORD"
      ? "active"
      : "inactive";


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


      <div
        style="
          min-width:0;
        "
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
              font-size:14px;
            "
          >
            ${escapeHtml(animal.name)}
          </strong>


          <span
            style="
              display:inline-flex;
              align-items:center;
              padding:4px 8px;
              border-radius:999px;
              background:${
                statusClass === "active"
                  ? "rgba(45,138,98,.12)"
                  : "rgba(184,76,76,.12)"
              };
              color:${
                statusClass === "active"
                  ? "#287651"
                  : "#a64040"
              };
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
                    display:inline-flex;
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
          onclick="openAnimalEditor('${escapeHtml(animal.id)}')"
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

function setLoading(isLoading) {

  loading.style.display =
    isLoading
      ? "block"
      : "none";
}


/* ============================================================
   ADD ANIMAL
   ============================================================ */

function openAddAnimal() {

  alert(
    "The Add Animal editor will be added in the next step."
  );
}


/* ============================================================
   EDIT ANIMAL
   ============================================================ */

function openAnimalEditor(animalId) {

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


  alert(
    `Animal Editor\n\n${animal.name}\n${animal.animal_id}\n\nThe full editor will be added in the next step.`
  );
}


/* ============================================================
   FORM EVENTS
   ============================================================ */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const email =
      emailInput.value;


    const password =
      passwordInput.value;


    if (!email || !password) {

      showLoginMessage(
        "Please enter your email and password."
      );

      return;
    }


    await login(
      email,
      password
    );
  }
);


/* ============================================================
   LOGOUT EVENT
   ============================================================ */

logoutButton.addEventListener(
  "click",
  logout
);


/* ============================================================
   SEARCH EVENT
   ============================================================ */

animalSearch.addEventListener(
  "input",
  event => {

    searchAnimals(
      event.target.value
    );
  }
);


/* ============================================================
   ADD ANIMAL EVENTS
   ============================================================ */

addAnimalButton.addEventListener(
  "click",
  openAddAnimal
);


emptyAddAnimalButton.addEventListener(
  "click",
  openAddAnimal
);


/* ============================================================
   AUTH STATE LISTENER
   ============================================================ */

supabaseClient.auth.onAuthStateChange(
  async (event, session) => {

    console.log(
      "Auth event:",
      event
    );


    /*
      SIGNED_OUT
    */

    if (!session) {

      currentUser = null;

      currentAdmin = null;

      showLogin();

      return;
    }


    /*
      We already handle the login
      explicitly above.
    */

    if (
      event === "SIGNED_IN" ||
      event === "INITIAL_SESSION"
    ) {

      /*
        Avoid duplicate work if login()
        already loaded the dashboard.
      */

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
          "Session verification failed:",
          error
        );


        await supabaseClient.auth.signOut();

        currentUser = null;

        currentAdmin = null;

        showLogin();

        showLoginMessage(
          error.message ||
          "Administrator verification failed."
        );
      }
    }
  }
);


/* ============================================================
   INITIAL SESSION CHECK
   ============================================================ */

async function initialize() {

  showLogin();

  setLoading(false);


  try {

    const {
      data,
      error
    } = await supabaseClient.auth.getSession();


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
   START APPLICATION
   ============================================================ */

initialize();
