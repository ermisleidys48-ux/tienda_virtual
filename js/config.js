const SB_URL = "https://rdyclinraavkirzfigjl.supabase.co"; 
const SB_KEY = "sb_publishable_fEGEgkJNYMzVPgzDaEwlsg_W1XiFyt6";
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);

let products = [];
let cart = [];
let user = null;
let address = "";
let whatsappMsg = "";
let shippingCost = 0;
let storePhone = "";

// Funciones globales de UI
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}
