// app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const iframe = document.getElementById('iframe-preview');
    const btnAddProdutos = document.getElementById('btn-add-produtos');
    const btnAddBanner = document.getElementById('btn-add-banner');
    const blocosContainer = document.getElementById('blocos-container');
    const btnCopiarHtml = document.getElementById('btn-copiar-html');
    const btnExportarHtml = document.getElementById('btn-exportar-html');
    const validityDateInput = document.getElementById('validity-date');
    
    // --- ESTADO DA APLICAÇÃO ---
    let emailBody = []; // Array que armazena todos os blocos do email
    let uniqueId = 0;
    const predefinedColors = {
        "Cinzento": "#414142",
        "Vermelho": "#C7070E",
        "Laranja": "#F3A453"
    };

    // --- FUNÇÕES DE CRIAÇÃO DE DADOS ---
    const criarDadosProduto = () => ({
        nome: "Novo Produto", subtitulo: "Subtítulo do produto", 
        precoAntigo: "", preco: "0,00", precoClube: "",
        imagem: "https://via.placeholder.com/180x180/EEEEEE/AAAAAA?text=Produto", link: "#", utm_campaign: "",
        seloDesconto: "NOVO", seloOferta: "", corSeloDesconto: "#C7070E", corSeloOferta: "#414142"
    });

    const criarDadosBanner = () => ({
        imagem: "https://via.placeholder.com/640x200/cccccc/FFFFFF?text=Novo+Banner", link: "#", utm_campaign: ""
    });

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const renderizarEditorUI = () => {
        const openStates = new Map();
        document.querySelectorAll('.bloco-container').forEach(container => {
            const mainDetails = container.querySelector(':scope > details');
            const productDetails = container.querySelectorAll('.editor-produto-item');
            if(mainDetails) {
                 openStates.set(container.dataset.id, {
                    main: mainDetails.open,
                    products: Array.from(productDetails).map(d => d.open)
                });
            }
        });

        blocosContainer.innerHTML = '';
        emailBody.forEach((bloco, index) => {
            const container = document.createElement('div');
            container.className = 'bloco-container';
            container.dataset.id = bloco.id;
            const content = (bloco.type === 'produtos') ? criarEditorProdutos(bloco) : criarEditorBanner(bloco);
            container.innerHTML = `
                <details>
                    <summary class="bloco-header">
                        <div class="bloco-controles">
                            <i class="fas fa-grip-vertical drag-handle"></i>
                            <button class="btn-eliminar" title="Eliminar bloco"><i class="fas fa-trash-alt"></i></button>
                        </div>
                        <h3><i class="fas ${bloco.type === 'produtos' ? 'fa-th-large' : 'fa-image'}"></i> Bloco ${index + 1}: ${bloco.type === 'produtos' ? 'Grade de Produtos' : 'Banner'}</h3>
                    </summary>
                    ${content}
                </details>
            `;
            blocosContainer.appendChild(container);

            const savedState = openStates.get(bloco.id);
            const mainDetails = container.querySelector(':scope > details');
            if (savedState) {
                if (mainDetails) mainDetails.open = savedState.main;
                if (bloco.type === 'produtos') {
                    const productDetails = container.querySelectorAll('.editor-produto-item');
                    productDetails.forEach((detail, idx) => {
                        if (savedState.products[idx] !== undefined) {
                            detail.open = savedState.products[idx];
                        }
                    });
                }
            } else if (mainDetails) {
                mainDetails.open = true; // Abre novos blocos por defeito
            }
        });
    };

    const renderizarPreviewUI = () => {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDocument) return;
        
        const corpoEmail = iframeDocument.getElementById('corpo-email');
        if (corpoEmail) {
            corpoEmail.innerHTML = emailBody.map(bloco => (bloco.type === 'produtos') ? criarHtmlGradeProdutos(bloco.items) : criarHtmlBanner(bloco.data)).join('');
        }

        const validityRow = iframeDocument.getElementById('validity-row');
        const validityText = iframeDocument.getElementById('validity-text');
        if (validityRow && validityText) {
            const dateValue = validityDateInput.value;
            if (dateValue) {
                const [year, month, day] = dateValue.split('-');
                validityText.textContent = `Ofertas válidas para o dia ${day}/${month}/${year}, enquanto durarem os estoques.`;
                validityRow.style.display = 'table-row';
            } else {
                validityRow.style.display = 'none';
            }
        }
    };
    
    const fullRender = () => {
        renderizarEditorUI();
        renderizarPreviewUI();
    };

    // --- FUNÇÕES DE CRIAÇÃO DE HTML (EDITOR E PREVIEW) ---

    const criarEditorProdutos = (bloco) => {
        let itemsHtml = '';
        bloco.items.forEach((produto, index) => {
            const colorOptionsHtml = (field, selectedColor) => {
                let paletteHtml = '<div class="color-palette">';
                for (const [name, hex] of Object.entries(predefinedColors)) {
                    const isSelected = selectedColor === hex ? 'selected' : '';
                    paletteHtml += `<div class="color-box ${isSelected}" data-field="${field}" data-index="${index}" data-color="${hex}" style="background-color: ${hex};" title="${name}"></div>`;
                }
                paletteHtml += '</div>';
                return paletteHtml;
            };

            itemsHtml += `
                <details class="editor-produto-item">
                    <summary><span class="accordion-title">${index + 1}: ${produto.nome}</span></summary>
                    <div class="editor-content">
                        <label>Nome:</label><input type="text" class="editor-input" data-field="nome" data-index="${index}" value="${produto.nome}">
                        <label>Subtítulo:</label><input type="text" class="editor-input" data-field="subtitulo" data-index="${index}" value="${produto.subtitulo}">
                        <div class="form-grid">
                           <div><label>Link:</label><input type="url" class="editor-input" data-field="link" data-index="${index}" value="${produto.link}"></div>
                           <div><label>Imagem (URL):</label><input type="url" class="editor-input" data-field="imagem" data-index="${index}" value="${produto.imagem}"></div>
                        </div>
                        <label>Campanha UTM:</label><input type="text" class="editor-input" data-field="utm_campaign" data-index="${index}" value="${produto.utm_campaign}" placeholder="Ex: produto_x_promo">
                        <div class="form-grid">
                           <div><label>Preço Antigo:</label><div class="input-group"><span class="input-group-text">R$</span><input type="text" class="editor-input" data-field="precoAntigo" data-index="${index}" value="${produto.precoAntigo}" placeholder="0,00"></div></div>
                           <div><label>Preço Novo:</label><div class="input-group"><span class="input-group-text">R$</span><input type="text" class="editor-input" data-field="preco" data-index="${index}" value="${produto.preco}" placeholder="0,00"></div></div>
                        </div>
                        <div><label>Preço Clube:</label><div class="input-group"><span class="input-group-text">Clube R$</span><input type="text" class="editor-input" data-field="precoClube" data-index="${index}" value="${produto.precoClube || ''}" placeholder="0,00"></div></div>
                        <label>Selo Desconto:</label>
                        <div class="selo-container"><input type="text" class="editor-input" data-field="seloDesconto" data-index="${index}" value="${produto.seloDesconto}">${colorOptionsHtml('corSeloDesconto', produto.corSeloDesconto)}</div>
                        <label>Selo Oferta:</label>
                        <div class="selo-container"><input type="text" class="editor-input" data-field="seloOferta" data-index="${index}" value="${produto.seloOferta}">${colorOptionsHtml('corSeloOferta', produto.corSeloOferta)}</div>
                    </div>
                </details>`;
        });
        return itemsHtml;
    };

    const criarEditorBanner = (bloco) => `
        <div class="editor-content">
            <label><i class="fas fa-image"></i> Imagem (URL):</label><input type="url" class="editor-input" data-field="imagem" value="${bloco.data.imagem}">
            <label><i class="fas fa-link"></i> Link:</label><input type="url" class="editor-input" data-field="link" value="${bloco.data.link}">
            <label><i class="fas fa-bullhorn"></i> Campanha UTM:</label><input type="text" class="editor-input" data-field="utm_campaign" value="${bloco.data.utm_campaign}" placeholder="Ex: banner_frete_gratis">
        </div>`;

    const criarHtmlGradeProdutos = (items) => {
        let produtosHtml = '';
        items.forEach(p => {
            const precoAntigo = p.precoAntigo ? `<p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#6c757d;text-decoration:line-through;">R$ ${p.precoAntigo}</p>` : `<p style="margin:0;font-family:Arial,sans-serif;font-size:12px;visibility:hidden;">-</p>`;
            const precoClube = p.precoClube ? `<p style="margin:5px 0 0 0;font-family:Arial,sans-serif;font-size:14px;color:#ff5005;font-weight:bold;">Clube R$ ${p.precoClube}</p>` : '';
            const seloDesc = p.seloDesconto ? `<span style="background-color:${p.corSeloDesconto};color:#ffffff;padding:4px 8px;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;border-radius:4px;">${p.seloDesconto}</span>` : '';
            const seloOfr = p.seloOferta ? `<span style="background-color:${p.corSeloOferta};color:#ffffff;padding:5px 10px;font-family:Arial,sans-serif;font-size:10px;font-weight:bold;">${p.seloOferta}</span>` : '';
            produtosHtml += `<td align="center" valign="top" style="padding:0 10px 20px 10px;width:33.33%;" class="responsive-column"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff;border-radius:8px;border:1px solid #e9ecef;height:380px;"><tr><td style="padding:15px;" valign="top"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td valign="top" height="170" width="100%"><a href="${p.link}" target="_blank" style="text-decoration:none;"><div style="width:100%;height:170px;background-image:url('${p.imagem}');background-position:center center;background-size:contain;background-repeat:no-repeat;"><!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:100%;height:170px;"><v:fill type="frame" src="${p.imagem}" color="#ffffff" /><v:textbox inset="0,0,0,0"><![endif]--><div><table border="0" cellpadding="0" cellspacing="0" width="100%" height="170"><tr><td align="left" valign="top" style="padding:5px;">${seloDesc}</td></tr><tr><td align="center" valign="bottom" style="padding-bottom:5px;">${seloOfr}</td></tr></table></div><!--[if gte mso 9]></v:textbox></v:rect><![endif]--></div></a></td></tr><tr><td align="center" style="padding:10px 0 5px 0;font-family:Arial,sans-serif;font-size:14px;color:#343a40;height:45px;" valign="top">${p.nome}<br><span style="font-size:12px;color:#6c757d;font-weight:normal;">${p.subtitulo}</span></td></tr><tr><td align="center" style="padding:5px 0;height:25px;" valign="center">${precoClube}</td></tr><tr><td align="center" style="padding:5px 0;height:40px;" valign="top">${precoAntigo}<p style="margin:5px 0 0 0;font-family:Arial,sans-serif;font-size:22px;color:#212529;font-weight:bold;">R$ ${p.preco}</p></td></tr><tr><td align="center" style="padding:15px 0 0 0;"><a href="${p.link}" target="_blank" style="background-color:#f3a453;color:#ffffff;padding:12px 20px;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;border-radius:20px;display:block;">COMPRAR</a></td></tr></table></td></tr></table></td>`;
        });
        return `<tr><td align="center" style="padding: 20px 10px;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr>${produtosHtml}</tr></table></td></tr>`;
    };

    const criarHtmlBanner = (data) => `<tr><td style="padding:0 0 20px 0;"><a href="${data.link}" target="_blank"><img src="${data.imagem}" width="640" alt="Banner" style="display:block;width:100%;max-width:640px;height:auto;"></a></td></tr>`;

    // --- FUNÇÕES DE EVENTOS E LÓGICA UTM ---
    const appendUtmParams = (url, utmCampaign) => {
        if (!url || url === '#') return url;
        const utmParams = `utm_source=dinamize&utm_medium=email`;
        let finalUrl = url.includes('?') ? `${url}&${utmParams}` : `${url}?${utmParams}`;
        if (utmCampaign) {
            finalUrl += `&utm_campaign=${encodeURIComponent(utmCampaign)}`;
        }
        return finalUrl;
    };

    const handleAddProdutos = () => { emailBody.push({ id: `bloco-${uniqueId++}`, type: 'produtos', items: [criarDadosProduto(), criarDadosProduto(), criarDadosProduto()] }); fullRender(); };
    const handleAddBanner = () => { emailBody.push({ id: `bloco-${uniqueId++}`, type: 'banner', data: criarDadosBanner() }); fullRender(); };
    
    const handleEditorInput = (e) => {
        const input = e.target;
        const blocoDiv = input.closest('.bloco-container');
        if (!blocoDiv) return;
        const bloco = emailBody.find(b => b.id === blocoDiv.dataset.id);
        if (!bloco) return;
        
        if (bloco.type === 'produtos') {
            const index = input.dataset.index;
            const field = input.dataset.field;
            bloco.items[index][field] = input.value;
            if (field === 'nome') input.closest('.editor-produto-item').querySelector('.accordion-title').textContent = `${parseInt(index) + 1}: ${input.value}`;
        } else {
            bloco.data[input.dataset.field] = input.value;
        }
        renderizarPreviewUI();
    };

    const getFinalHtml = () => {
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDocument) return null;
        
        const docClone = iframeDocument.cloneNode(true);
        
        // Esta função reconstrói o HTML final com os UTMs corretos
        const finalBody = emailBody.map(bloco => {
            if (bloco.type === 'produtos') {
                const itemsWithUtm = bloco.items.map(p => ({...p, link: appendUtmParams(p.link, p.utm_campaign)}));
                return criarHtmlGradeProdutos(itemsWithUtm);
            } else {
                const dataWithUtm = {...bloco.data, link: appendUtmParams(bloco.data.link, bloco.data.utm_campaign)};
                return criarHtmlBanner(dataWithUtm);
            }
        }).join('');
        
        const globalBannerLink = docClone.getElementById('global-banner-principal-link');
        const globalStickBarLink = docClone.getElementById('global-stick-bar-link');
        
        const globalBannerUtm = document.getElementById('global-banner-principal-utm').value;
        const globalStickBarUtm = document.getElementById('global-stick-bar-utm').value;

        if(globalBannerLink) globalBannerLink.href = appendUtmParams(globalBannerLink.href, globalBannerUtm);
        if(globalStickBarLink) globalStickBarLink.href = appendUtmParams(globalStickBarLink.href, globalStickBarUtm);
        
        docClone.querySelectorAll('.nav-column a, a[href*="facebook"], a[href*="instagram"], a[href*="whatsapp"]').forEach(link => {
            const isSocial = link.querySelector('img');
            const utmCampaign = isSocial ? `rodape_${isSocial.alt.toLowerCase()}` : `menu_${link.textContent.toLowerCase().replace(/\s+/g, '_')}`;
            link.href = appendUtmParams(link.href, utmCampaign);
        });

        docClone.getElementById('corpo-email').innerHTML = finalBody;

        const link = docClone.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        docClone.head.appendChild(link);
        return `<!DOCTYPE html>\n${docClone.documentElement.outerHTML}`;
    };

    const handleCopiarHtml = () => {
        const html = getFinalHtml();
        if (!html) return;
        navigator.clipboard.writeText(html).then(() => {
            const originalText = btnCopiarHtml.innerHTML;
            btnCopiarHtml.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            setTimeout(() => { btnCopiarHtml.innerHTML = originalText; }, 2000);
        });
        document.getElementById('html-final').value = html;
    };

    const handleExportarHtml = () => {
        const html = getFinalHtml();
        if (!html) return;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email-template.html';
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- INICIALIZAÇÃO ---
    const init = () => {
        ['global-banner-principal-img', 'global-banner-principal-link', 'global-stick-bar-img', 'global-stick-bar-link'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (!iframeDoc) return;

                const principalImg = iframeDoc.getElementById('global-banner-principal');
                const principalLink = iframeDoc.getElementById('global-banner-principal-link');
                const stickImg = iframeDoc.getElementById('global-stick-bar');
                const stickLink = iframeDoc.getElementById('global-stick-bar-link');
                
                if(principalImg) principalImg.src = document.getElementById('global-banner-principal-img').value;
                if(principalLink) principalLink.href = document.getElementById('global-banner-principal-link').value;
                if(stickImg) stickImg.src = document.getElementById('global-stick-bar-img').value;
                if(stickLink) stickLink.href = document.getElementById('global-stick-bar-link').value;
            });
        });
        
        validityDateInput.addEventListener('input', renderizarPreviewUI);
        btnAddProdutos.addEventListener('click', handleAddProdutos);
        btnAddBanner.addEventListener('click', handleAddBanner);
        blocosContainer.addEventListener('input', handleEditorInput);
        btnCopiarHtml.addEventListener('click', handleCopiarHtml);
        btnExportarHtml.addEventListener('click', handleExportarHtml);
        
        new Sortable(blocosContainer, {
            animation: 150,
            handle: '.drag-handle',
            onEnd: (evt) => {
                const item = emailBody.splice(evt.oldIndex, 1)[0];
                emailBody.splice(evt.newIndex, 0, item);
                fullRender();
            }
        });

        blocosContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            // Corrige o bug da paleta de cores
            if (target.classList.contains('color-box')) {
                e.preventDefault(); 
                e.stopPropagation();
                
                const blocoDiv = target.closest('.bloco-container');
                if (!blocoDiv) return;
                const bloco = emailBody.find(b => b.id === blocoDiv.dataset.id);
                if (!bloco) return;

                const field = target.dataset.field;
                const index = target.dataset.index;
                const color = target.dataset.color;
                if (bloco.items && bloco.items[index]) {
                    bloco.items[index][field] = color;
                    fullRender();
                }
            }

            const btnEliminar = target.closest('.btn-eliminar');
            if(btnEliminar) {
                const blocoDiv = btnEliminar.closest('.bloco-container');
                if(!blocoDiv) return;
                const index = emailBody.findIndex(b => b.id === blocoDiv.dataset.id);
                if (confirm('Tem a certeza?')) {
                    emailBody.splice(index, 1);
                    fullRender();
                }
            }
        });
        
        fullRender();
    };

    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        init();
    } else {
        iframe.addEventListener('load', init);
    }
});

