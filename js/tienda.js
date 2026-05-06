window.onload = async () => {
    const { data: config, error } = await supabaseClient.from('configuracion').select('*');
    if (!error && config) {
        config.forEach(item => {
            if (item.key === 'store_name') {
                document.getElementById('store-logo').innerText = item.value;
                document.getElementById('store-name-input').value = item.value;
                document.title = item.value;
            }
            if (item.key === 'shipping_cost') {
                shippingCost = parseFloat(item.value);
                document.getElementById('shipping-cost-input').value = shippingCost;
            }
            if (item.key === 'store_phone') {
                storePhone = item.value;
                document.getElementById('store-phone-input').value = item.value;
            }
        });
    }
    fetchProducts();
};

async function fetchProducts() {
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('store-grid').innerHTML = "";
    const { data, error } = await supabaseClient.from('productos').select('*').order('created_at', { ascending: false });
    document.getElementById('loader').style.display = 'none';
    if (!error) { products = data; render(); }
}

function render() {
    const g = document.getElementById('store-grid');
    g.innerHTML = products.map(p => `
        <div class="card">
            ${user === 'admin' ? `<button class="delete-btn" style="display:block" onclick="remove(${p.id})">Borrar</button>` : ''}
            <img src="${p.img}" loading="lazy">
            <div class="stock-tag ${p.stock <= 0 ? 'out-of-stock' : ''}">${p.stock > 0 ? 'Stock: '+p.stock : 'AGOTADO'}</div>
            <h3 style="margin:5px 0">${p.name}</h3>
            <div style="color:var(--accent); font-weight:bold; margin-bottom:10px">$${p.price}</div>
            <button class="btn btn-blue" style="width:100%; justify-content:center" onclick="addCart(${p.id})" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Agotado' : 'Añadir'}</button>
        </div>
    `).join('');
}

function addCart(id) {
    if(!user) return showModal('modalAuth');
    const p = products.find(x => x.id === id);
    const inCart = cart.filter(item => item.id === id).length;
    if(p.stock <= inCart) return alert("No hay más stock disponible");
    cart.push({...p, cartId: Date.now() + Math.random()});
    updateCart();
    showToast();
}

function updateCart() {
    document.getElementById('count').innerText = cart.length;
    const grouped = cart.reduce((acc, item) => {
        if (!acc[item.id]) acc[item.id] = { ...item, qty: 0 };
        acc[item.id].qty++;
        return acc;
    }, {});
    let subtotal = 0;
    document.getElementById('cart-list').innerHTML = Object.values(grouped).map(i => {
        subtotal += (parseFloat(i.price) * i.qty);
        return `<div style="padding:10px; background:#1f2937; margin:5px; border-radius:8px; display:flex; justify-content:space-between; align-items:center">
            <div><span>${i.name}</span><br><small style="color:var(--accent)">$${i.price} c/u</small></div>
            <div style="display:flex; align-items:center; gap:10px">
                <button class="qty-btn" onclick="changeQty(${i.id}, -1)">-</button>
                <span>${i.qty}</span>
                <button class="qty-btn" onclick="changeQty(${i.id}, 1)">+</button>
                <i class="fas fa-trash remove-item" onclick="removeFromCart(${i.id})"></i>
            </div>
        </div>`;
    }).join('');
    const isDelivery = document.getElementById('shipping-method').value === "delivery";
    const finalShipping = isDelivery ? shippingCost : 0;
    document.getElementById('shipping-line').style.display = isDelivery ? 'flex' : 'none';
    document.getElementById('shipping-price-display').innerText = `$${finalShipping}`;
    document.getElementById('cart-subtotal').innerText = `$${subtotal}`;
    document.getElementById('cart-total').innerText = `$${subtotal + finalShipping}`;
}

function changeQty(id, delta) {
    if (delta > 0) addCart(id);
    else {
        const index = cart.findLastIndex(item => item.id === id);
        if (index !== -1) cart.splice(index, 1);
        updateCart();
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
}

async function checkout() {
    if(cart.length === 0) return;
    const isDelivery = document.getElementById('shipping-method').value === "delivery";
    if(isDelivery && (!address || address.trim() === "")) {
        alert("Ingresa tu dirección en el perfil.");
        showModal('modalAuth');
        return;
    }
    let subtotal = 0;
    let summary = {};
    cart.forEach(item => {
        if(!summary[item.id]) summary[item.id] = { name: item.name, qty: 0, price: item.price };
        summary[item.id].qty++;
        subtotal += parseFloat(item.price);
    });
    const total = isDelivery ? subtotal + shippingCost : subtotal;
    for(let id in summary) {
        const original = products.find(p => p.id == id);
        if(original) await supabaseClient.from('productos').update({ stock: original.stock - summary[id].qty }).eq('id', id);
    }
    whatsappMsg = "*PEDIDO DE: " + (user || "Cliente").toUpperCase() + "*%0A";
    whatsappMsg += "*ENTREGA:* " + (isDelivery ? "Envío" : "Retiro") + "%0A";
    let html = "";
    for(let id in summary) {
        let s = summary[id];
        html += `<div class="invoice-line"><span>${s.name} x${s.qty}</span><span>$${s.qty * s.price}</span></div>`;
        whatsappMsg += `- ${s.name} (x${s.qty}): $${s.qty * s.price}%0A`;
    }
    whatsappMsg += "%0A*TOTAL: $" + total + "*";
    document.getElementById('invoice-details').innerHTML = html + `<div style="border-top:1px solid #333; margin-top:10px; padding-top:10px; font-weight:bold; display:flex; justify-content:space-between; color:var(--accent)"><span>TOTAL:</span><span>$${total}</span></div>`;
    cart = []; updateCart(); fetchProducts(); closeModal('modalCart'); showModal('modalInvoice');
}

function shareWhatsApp() { 
    if(!storePhone) return alert("WhatsApp no configurado.");
    window.open("https://wa.me/" + storePhone + "?text=" + whatsappMsg, '_blank'); 
}
