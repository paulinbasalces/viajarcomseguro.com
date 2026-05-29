document.addEventListener('DOMContentLoaded', () => {
    let baseDeDados = [];
    let categoriaAtiva = 'Todas';
    const SITE_URL = 'https://viajarcomseguro.com/';

    // Metadados Editoriais para enriquecer os modais baseados na categoria
    const categoriasMeta = {
        'Comparadores e Tradicionais': {
            melhorPara: 'Quem precisa avaliar dezenas de operadoras lado a lado para encontrar o menor preço ou a melhor franquia médica.',
            cuidado: 'O preço baixo pode esconder franquias altas para acionamento de acidentes simples.'
        },
        'Europa (Schengen)': {
            melhorPara: 'Viajantes com destino ao continente europeu que precisam obrigatoriamente do certificado de 30 mil euros para a imigração.',
            cuidado: 'Verifique se a seguradora cobre os custos via telemedicina ou se exige reembolso posterior.'
        },
        'Esportes e Aventura': {
            melhorPara: 'Mochileiros, esquiadores ou mergulhadores. Apólices comuns quase sempre excluem resgate em esportes.',
            cuidado: 'Revise se a modalidade exata do seu esporte (ex: mergulho acima de 20m) está na lista de aceitação.'
        },
        'Cartões de Crédito': {
            melhorPara: 'Economizar na emissão primária da apólice caso a passagem integral tenha sido comprada no cartão elegível.',
            cuidado: 'O benefício não é automático. Você DEVE emitir o bilhete no portal da bandeira ANTES de embarcar.'
        },
        'Nômades Digitais': {
            melhorPara: 'Profissionais que viajam por tempo indeterminado e necessitam de planos flexíveis sem data de volta.',
            cuidado: 'Coberturas preventivas (como exames de rotina) geralmente não estão inclusas neste formato.'
        }
    };

    const seletor = {
        busca: document.getElementById('campo-busca'),
        limparBusca: document.getElementById('btn-limpar-busca'),
        bentoMenu: document.getElementById('bento-menu'),
        listaFerramentas: document.getElementById('lista-ferramentas'),
        statusResultados: document.getElementById('status-resultados')
    };

    fetch('dados.json')
        .then(res => {
            if (!res.ok) throw new Error('Falha no JSON');
            return res.json();
        })
        .then(data => {
            baseDeDados = data || [];
            document.getElementById('total-ferramentas').textContent = baseDeDados.length;
            document.getElementById('total-categorias').textContent = new Set(baseDeDados.map(i => i.categoria)).size;
            renderizarFiltros(baseDeDados);
            renderizarInterface();
            aplicarBuscaDaUrl();
            abrirFerramentaDaUrl();
        })
        .catch(erro => {
            seletor.listaFerramentas.innerHTML = '<div style="text-align:center; padding: 40px; color: #64748B;">Erro ao carregar o diretório de seguros.</div>';
        });

    seletor.busca.addEventListener('input', () => {
        atualizarParametroBusca();
        renderizarInterface();
    });

    seletor.limparBusca.addEventListener('click', () => {
        seletor.busca.value = '';
        categoriaAtiva = 'Todas';
        atualizarUrl({ q: null, ferramenta: null });
        renderizarFiltros(baseDeDados);
        renderizarInterface();
    });

    function renderizarFiltros(ferramentas) {
        const categorias = ['Todas', ...new Set(ferramentas.map(item => item.categoria))];
        seletor.bentoMenu.innerHTML = categorias.map(categoria => {
            const ativo = categoria === categoriaAtiva ? 'true' : 'false';
            const emoji = categoria === 'Todas' ? 'Tudo' : ferramentas.find(item => item.categoria === categoria)?.emoji;
            const total = categoria === 'Todas' ? ferramentas.length : ferramentas.filter(item => item.categoria === categoria).length;

            return `
                <button type="button" class="bento-card" data-categoria="${categoria}" aria-pressed="${ativo}">
                    <span class="bento-emoji" aria-hidden="true">${emoji || '🗺️'}</span>
                    <span class="bento-title">${categoria}</span>
                    <span class="bento-count">${total}</span>
                </button>
            `;
        }).join('');

        seletor.bentoMenu.querySelectorAll('.bento-card').forEach(botao => {
            botao.addEventListener('click', () => {
                categoriaAtiva = botao.dataset.categoria;
                renderizarFiltros(baseDeDados);
                renderizarInterface();
                document.getElementById('lista-ferramentas').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    function renderizarInterface() {
        const termo = seletor.busca.value.trim().toLowerCase();
        
        const filtradas = baseDeDados.filter(item => {
            const matchTexto = termo === '' || 
                               item.nome.toLowerCase().includes(termo) || 
                               item.dor_resolvida.toLowerCase().includes(termo) || 
                               item.descricao.toLowerCase().includes(termo);
            const matchCat = categoriaAtiva === 'Todas' || item.categoria === categoriaAtiva;
            return matchTexto && matchCat;
        });

        seletor.statusResultados.textContent = `${filtradas.length} de ${baseDeDados.length} apólices disponíveis exibidas.`;

        if (!filtradas.length) {
            seletor.listaFerramentas.innerHTML = '<div style="text-align:center; padding: 40px; color: #64748B;">Nenhum seguro encontrado com este perfil.</div>';
            return;
        }

        const categoriasInfo = filtradas.reduce((acc, item) => {
            if (!acc[item.categoria]) acc[item.categoria] = [];
            acc[item.categoria].push(item);
            return acc;
        }, {});

        seletor.listaFerramentas.innerHTML = Object.keys(categoriasInfo).map((categoria, index, arr) => {
            const itens = categoriasInfo[categoria];
            const cards = itens.map(item => `
                <article class="card">
                    <div class="card-conteudo">
                        <div class="card-topo">
                            <span class="card-emoji">${item.emoji}</span>
                            <span class="card-tag">${item.categoria}</span>
                        </div>
                        <h3>${item.nome}</h3>
                        <p class="card-desc">${item.dor_resolvida}</p>
                        <p class="card-editorial">${item.descricao}</p>
                    </div>
                    <div class="card-footer">
                        <button type="button" class="btn-card-abrir" onclick="abrirModalFerramenta('${item.id}')">Explicar Cobertura</button>
                        <a class="link-card-oficial" href="${item.url}" target="_blank" rel="noopener noreferrer">Plataforma oficial ➔</a>
                    </div>
                </article>
            `).join('');

            // Injeção In-feed AdSense após categorias
            const ad = index < arr.length - 1 ? `<div class="area-adsense ads-home"><p class="ads-label">Publicidade</p></div>` : '';

            return `
                <section class="sessao-categoria">
                    <h2 class="sessao-titulo">${itens[0].emoji} ${categoria}</h2>
                    <div class="grid-cards">${cards}</div>
                </section>
                ${ad}
            `;
        }).join('');
    }

    window.abrirModalFerramenta = function(id, alterarUrl = true) {
        const ferramenta = baseDeDados.find(item => item.id === id);
        if (!ferramenta) return;

        const meta = categoriasMeta[ferramenta.categoria] || { melhorPara: "Todo viajante que preza por segurança.", cuidado: "Revise os limites de idade da apólice." };
        
        document.getElementById('artigo-emoji').textContent = ferramenta.emoji;
        document.getElementById('artigo-categoria').textContent = ferramenta.categoria;
        document.getElementById('artigo-titulo').textContent = ferramenta.nome;
        document.getElementById('artigo-dor').textContent = ferramenta.dor_resolvida;
        document.getElementById('artigo-descricao').textContent = ferramenta.descricao;
        document.getElementById('artigo-melhor-para').textContent = meta.melhorPara;
        document.getElementById('artigo-cuidado').textContent = meta.cuidado;
        document.getElementById('artigo-link').href = ferramenta.url;

        renderizarCompartilhamento(ferramenta);

        document.getElementById('modal-overlay').classList.remove('hidden');
        document.body.classList.add('modal-open');

        if (alterarUrl) atualizarUrl({ ferramenta: ferramenta.id });
    };

    window.fecharTodosModais = function() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.body.classList.remove('modal-open');
        atualizarUrl({ ferramenta: null });
    };

    window.fecharAoClicarFora = function(event) {
        if (event.target.id === 'modal-overlay') fecharTodosModais();
    };

    function renderizarCompartilhamento(ferramenta) {
        const container = document.getElementById('botoes-compartilhamento');
        container.innerHTML = '';
        
        const urlCompartilhamento = `${SITE_URL}?ferramenta=${ferramenta.id}`;
        
        if (navigator.share && window.innerWidth <= 768) {
            const btn = document.createElement('button');
            btn.className = 'btn-primario';
            btn.style.width = '100%';
            btn.style.background = '#1E293B';
            btn.textContent = 'Compartilhar Link';
            btn.onclick = () => navigator.share({ title: ferramenta.nome, text: ferramenta.dor_resolvida, url: urlCompartilhamento });
            container.appendChild(btn);
        } else {
            const btnCopiar = document.createElement('button');
            btnCopiar.className = 'btn-card-abrir';
            btnCopiar.style.width = '100%';
            btnCopiar.textContent = 'Copiar link desta seguradora';
            btnCopiar.onclick = () => {
                navigator.clipboard.writeText(urlCompartilhamento);
                btnCopiar.textContent = 'Copiado!';
                setTimeout(() => btnCopiar.textContent = 'Copiar link desta seguradora', 2000);
            };
            container.appendChild(btnCopiar);
        }
    }

    function atualizarUrl(params, substituir = false) {
        const url = new URL(window.location.href);
        Object.entries(params).forEach(([chave, valor]) => {
            if (valor) url.searchParams.set(chave, valor);
            else url.searchParams.delete(chave);
        });
        const metodo = substituir ? 'replaceState' : 'pushState';
        window.history[metodo]({}, '', url);
    }

    function atualizarParametroBusca() {
        atualizarUrl({ q: seletor.busca.value || null, ferramenta: null }, true);
    }

    function aplicarBuscaDaUrl() {
        const termo = new URL(window.location.href).searchParams.get('q');
        if (termo) { seletor.busca.value = termo; renderizarInterface(); }
    }

    function abrirFerramentaDaUrl() {
        const ferramenta = new URL(window.location.href).searchParams.get('ferramenta');
        if (ferramenta) window.abrirModalFerramenta(ferramenta, false);
    }
});
