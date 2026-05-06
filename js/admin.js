function login() {
    const u = document.getElementById('u-in').value;
    const p = document.getElementById('p-in').value;
    address = document.getElementById('a-in').value;
    if(u === "admin" && p === "0607") {
        user = "admin";
        document.getElementById('btn-admin').style.display = 'inline-flex';
        document.getElementById('btn-user').innerText = "Modo Admin";
    } else if(u && p) {
        user = u;
        document.getElementById('btn-user').innerText = "Hola, " + u;
    }
    closeModal('modalAuth');
    render();
}

async function save() {
    const name = document.getElementById('n-prod').value;
    const price = document.getElementById('p-prod').value;
    const stock = parseInt(document.getElementById('s-prod').value);
    const file = document.getElementById('i-prod').files[0];
    if(!name || !price || !file || isNaN(stock)) return alert("Faltan datos");
    const reader = new FileReader();
    reader.onloadend = async () => {
        await supabaseClient.from('productos').insert([{ name, price, stock, img: reader.result }]);
        fetchProducts(); closeModal('modalAdmin');
    };
    reader.readAsDataURL(file);
}

async function remove(id) {
    if(confirm("¿Borrar producto?")) {
        await supabaseClient.from('productos').delete().eq('id', id);
        fetchProducts();
    }
}

async function updateStoreName() {
    const val = document.getElementById('store-name-input').value;
    await supabaseClient.from('configuracion').update({ value: val }).eq('key', 'store_name');
    location.reload();
}
