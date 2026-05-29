const SITE_URL = 'https://viajarcomseguro.com';
let dadosFerramentas = [];

const categoriasMeta = [
    { id: 'comparadores', nome: 'Comparadores' },
    { id: 'europa', nome: 'Europa (Schengen)' },
    { id: 'eua-canada', nome: 'EUA e Canadá' },
    { id: 'nomades', nome: 'Nômades Digitais' },
    { id: 'cartoes', nome: 'Cartões de Crédito' },
    { id: 'intercambio', nome: 'Intercâmbio' },
    { id: 'nacional', nome: 'Seguro Viagem Nacional' },
    { id: 'apoio', nome: 'Assistência e Apoio ao Viajante' }
];

document.addEventListener("DOMContentLoaded", () => {
    carregarDados();
    configurarBusca();
    configurarModal();
});

async function carregarDados() {
    try {
        const response = await fetch('dados.json');
        if (!response.ok) throw new Error('Falha HTTP');
        dadosFerramentas = await response.json();
        
        renderizarAncoras();
        renderizarSecoes(dadosFerramentas);

        const params = new URLSearchParams(window.location.search);
        const itemId = params.get('ferramenta');
        if (itemId) {
            const item = dadosFerramentas.find(i => i.id === itemId);
            if (item) abrirModal(item);
        }
    } catch (erro) {
        document.getElementById('content-sections').innerHTML = '<p style="text-align:center; padding: 60px;">Erro ao carregar o diretório de seguros. Atualize a página.</p>';
    }
}

function renderizarAncoras() {
    const container = document.getElementById('ancoras-container');
    container.innerHTML = '';
    categoriasMeta.forEach(cat => {
        const a = document.createElement('a');
        a.href = `#sec-${cat.id}`;
        a.textContent = cat.nome;
        container.appendChild(a);
    });
}

function renderizarSecoes(dados) {
    const main = document.getElementById('content-sections');
    main.innerHTML = '';

    categoriasMeta.forEach((cat, index) => {
        const itens = dados.filter(i => i.categoria === cat.nome);
        if (itens.length === 0) return;

        const section = document.createElement('section');
        section.className = 'category-section';
        section.id = `sec-${cat.id}`;

        const numSecao = String(index + 1).padStart(2, '0');

        let htmlCards = itens.map(item => `
            <div class="card">
                <div class="card-top">
                    <span class="card-icon">${item.emoji}</span>
                    <h3>${item.nome}</h3>
                </div>
                <p class="card-desc">${item.dor_resolvida}</p>
                <div class="card-actions">
                    <button class="btn-card secondary" onclick="abrirModalPorId('${item.id}')">Explicar Cobertura</button>
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="btn-card primary">Acessar Oficial ➔</a>
                </div>
            </div>
        `).join('');

        section.innerHTML = `
            <div class="category-header">
                <h2><span>${numSecao}.</span> ${cat.nome}</h2>
                <span class="item-count">${itens.length} validadas</span>
            </div>
            <div class="card-grid">
                ${htmlCards}
            </div>
        `;
        main.appendChild(section);
    });

    if(main.innerHTML === '') {
        main.innerHTML = '<p style="text-align:center; padding: 60px; font-size: 1.2rem; color: #64748B;">Nenhuma apólice encontrada com esses termos.</p>';
    }
}

function configurarBusca() {
    const campo = document.getElementById('campo-busca');
    const btn = document.querySelector('.btn-search');
    
    const dispararBusca = () => {
        const termo = campo.value.toLowerCase();
        if(termo.length < 2) {
            renderizarSecoes(dadosFerramentas);
            return;
        }
        const filtrados = dadosFerramentas.filter(i => {
            return i.nome.toLowerCase().includes(termo) || 
                   i.descricao.toLowerCase().includes(termo) ||
                   i.dor_resolvida.toLowerCase().includes(termo) ||
                   i.categoria.toLowerCase().includes(termo);
        });
        renderizarSecoes(filtrados);
    };

    campo.addEventListener('input', dispararBusca);
    btn.addEventListener('click', dispararBusca);
}

window.abrirModalPorId = function(id) {
    const item = dadosFerramentas.find(i => i.id === id);
    if(item) abrirModal(item);
}

function abrirModal(item) {
    const modal = document.getElementById('modal-detalhes');
    const body = document.getElementById('modal-body');
    
    body.innerHTML = `
        <span class="modal-tag">${item.categoria}</span>
        <h2 id="modal-titulo" style="margin: 0 0 16px; font-size: 2rem; color: var(--primary-color);">${item.emoji} ${item.nome}</h2>
        <div style="background: var(--bg-page); padding: 16px; border-left: 4px solid var(--primary-color); border-radius: 4px; margin-bottom: 24px;">
            <p style="font-size: 1.1rem; color: var(--text-main); margin: 0;"><strong>Como resolve:</strong> ${item.dor_resolvida}</p>
        </div>
        <p style="line-height: 1.7; font-size: 1.05rem; color: var(--text-muted); margin-bottom: 40px;">${item.descricao}</p>
        <div style="display:flex; flex-direction: column; gap: 16px;">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" style="background: var(--action-color); color: #FFF; text-align:center; padding: 18px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 1.1rem; box-shadow: 0 4px 14px rgba(230, 95, 43, 0.4);">Acessar Portal Oficial ➔</a>
            <p style="text-align:center; font-size: 0.8rem; color: #94A3B8;">Você será redirecionado para a plataforma da seguradora/ferramenta.</p>
        </div>
    `;
    
    window.history.pushState({}, '', `?ferramenta=${item.id}`);
    modal.showModal();
}

function configurarModal() {
    const modal = document.getElementById('modal-detalhes');
    const btnFechar = document.getElementById('fechar-modal');
    
    const fechar = () => {
        modal.close();
        window.history.pushState({}, '', window.location.pathname);
    };

    btnFechar.addEventListener('click', fechar);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fechar();
    });
}
