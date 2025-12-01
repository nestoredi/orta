// =================================================================
// 1. UTILIDADES Y CONFIGURACIÓN INICIAL
// =================================================================

// Función principal que se ejecuta al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
});

// Función central para orquestar la carga de todos los módulos
async function inicializarApp() {
    console.log('Orta Muebles: Inicializando aplicación Mobile-First...');

    // Ejecutar tareas de alto impacto primero (carga de datos)
    const datosMenu = await cargarDatos('datos/menu.json');
    const datosProductos = await cargarDatos('datos/productos.json');

    // Ejecutar tareas de renderizado y eventos
    if (datosMenu) {
        renderizarMenu(datosMenu);
        configurarMenuHamburguesa();
    }

    if (datosProductos) {
        // Lógica para la Home Page (Productos Destacados)
        const contenedorDestacados = document.getElementById('featured-products');
        if (contenedorDestacados) {
            renderizarProductosDestacados(datosProductos);
            configurarEventosModal();
        }

        // Lógica para la Página de Productos (Catálogo Completo)
        const contenedorCatalogo = document.getElementById('full-catalog');
        if (contenedorCatalogo) {
            renderizarCatalogo(datosProductos);
            configurarEventosModal();
        }
    }

    // Inicializar el carrusel solo si existe en la página (Home)
    if (document.getElementById('hero-carousel')) {
        inicializarCarrusel();
    }

    // Inicializar lógica de formulario de contacto si existe
    configurarFormularioContacto();

    // Aplicar optimizaciones de rendimiento
    configurarLazyLoading();
}

// =================================================================
// 2. LÓGICA DE DATOS (Fetch de JSON)
// =================================================================

/**
* Carga un archivo JSON de la ruta especificada.
* @param {string} ruta - Ruta al archivo JSON (ej: '/datos/menu.json').
* @returns {Promise<Object|null>} - Retorna el objeto JSON o null en caso de error.
*/
async function cargarDatos(ruta) {
    try {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) {
            throw new Error(`Error al cargar ${ruta}: ${respuesta.statusText}`);
        }
        return await respuesta.json();
    } catch (error) {
        console.error("Fallo en la carga de datos:", error);
        return null;
    }
}

// =================================================================
// 3. LÓGICA DE NAVEGACIÓN Y MENÚ HAMBURGUESA
// =================================================================

/**
* Renderiza el menú de navegación a partir de los datos JSON.
* @param {Array} menuItems - Array de objetos del menú.
*/
function renderizarMenu(menuItems) {
    const navList = document.getElementById('menu-list');
    if (!navList) return;
    
    // Detectar página activa para resaltar el link
    const pathActual = window.location.pathname.split('/').pop() || 'index.html';

    navList.innerHTML = menuItems.map(item => {
        const isActive = item.url === pathActual ? 'active' : '';
        return `<li><a href="${item.url}" class="${isActive}" target="${item.target || '_self'}">${item.titulo}</a></li>`;
    }).join('');
}

/**
* Configura el evento de toggle para el menú hamburguesa.
*/
function configurarMenuHamburguesa() {
    const boton = document.querySelector('.hamburger-menu');
    const lista = document.getElementById('menu-list');
    
    if (!boton || !lista) return;

    boton.addEventListener('click', () => {
        // Toggle de clases para mostrar/ocultar el menú
        lista.classList.toggle('is-open');
        const isExpanded = boton.getAttribute('aria-expanded') === 'true' || false;
        boton.setAttribute('aria-expanded', !isExpanded);
    });
}

// =================================================================
// 4. LÓGICA DE CARRUSEL Y PRODUCTOS
// =================================================================

/**
* Inicializa la librería del carrusel (ej. Swiper.js) con las opciones para el Carrusel Infinito.
*/
function inicializarCarrusel() {
    // IMPORTANTE: Aquí se inicializa Swiper.js (o la librería elegida)
    if (typeof Swiper !== 'undefined') {
        new Swiper('#hero-carousel', {
            loop: true, // Requisito: Carrusel Infinito
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            // Configuraciones de diseño minimalista y performance
        });
    } else {
        console.warn('Swiper no está definido o no es necesario en esta página.');
    }
}

/**
* Genera el HTML de una tarjeta de producto.
*/
function crearHTMLProducto(prod) {
    return `
        <article class="product-card">
            <img data-src="${prod.imagen}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="${prod.nombre}" class="lazy-load">
            <h3>${prod.nombre}</h3>
            <p>${prod.descripcion_corta}</p>
            <button class="btn-cta btn-info" 
                data-id="${prod.id}"
                data-title="${prod.nombre}"
                data-desc="${prod.descripcion_larga}"
                data-price="${prod.precio}"
                data-img="${prod.imagen}">
                Información
            </button>
        </article>
    `;
}

/**
* Renderiza una selección de productos en la página Home (limitado a 3).
*/
function renderizarProductosDestacados(productos) {
    const contenedor = document.getElementById('featured-products');
    if (!contenedor) return;

    // Tomamos solo los primeros 3 para el home
    const destacados = productos.slice(0, 3);
    contenedor.innerHTML = destacados.map(crearHTMLProducto).join('');
}

/**
* Renderiza el catálogo completo en la página de Productos.
*/
function renderizarCatalogo(productos) {
    const contenedor = document.getElementById('full-catalog');
    if (!contenedor) return;

    contenedor.innerHTML = productos.map(crearHTMLProducto).join('');
}

/**
* Configura los eventos de los botones 'Información' para abrir los modales.
*/
function configurarEventosModal() {
    // Seleccionar todos los botones de 'Información' y adjuntar el evento 'click'
    const botones = document.querySelectorAll('.btn-info');
    const modal = document.getElementById('product-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    // Elementos internos del modal
    const modalTitle = document.getElementById('modal-title');
    const modalImg = document.getElementById('modal-img');
    const modalDesc = document.getElementById('modal-desc');
    const modalPrice = document.getElementById('modal-price');

    if (!modal) return;

    botones.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Cargar datos dinámicamente
            const data = e.target.dataset;
            modalTitle.textContent = data.title;
            modalImg.src = data.img;
            modalDesc.textContent = data.desc;
            modalPrice.textContent = `Precio: ${data.price}`;
            
            // Mostrar modal
            modal.classList.add('is-visible');
            modal.setAttribute('aria-hidden', 'false');
        });
    });

    // Cerrar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('is-visible');
            modal.setAttribute('aria-hidden', 'true');
        });
    }
    
    // Cerrar al hacer click fuera
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            modal.classList.remove('is-visible');
            modal.setAttribute('aria-hidden', 'true');
        }
    });
}

// =================================================================
// 5. LÓGICA DE FORMULARIOS (Contacto)
// =================================================================

/**
 * Configura el comportamiento del formulario de contacto.
 */
function configurarFormularioContacto() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        // Prevenir el envío real del formulario (recarga de página)
        e.preventDefault();
        
        // Simular un pequeño delay de procesamiento si se desea, o redirigir inmediatamente
        console.log('Formulario enviado. Redirigiendo a gracias...');
        window.location.href = 'gracias.html';
    });
}

// =================================================================
// 6. RENDIMIENTO Y OPTIMIZACIÓN (Lazy-Loading)
// =================================================================

/**
* Implementa el Lazy-Loading para todas las imágenes y videos.
*/
function configurarLazyLoading() {
    const lazyElements = document.querySelectorAll('img[data-src], video[data-src]');
    
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    if (element.dataset.src) {
                        element.src = element.dataset.src;
                        element.removeAttribute('data-src');
                        element.classList.remove('lazy-load');
                    }
                    observer.unobserve(element);
                }
            });
        }, {
            rootMargin: '0px 0px 200px 0px',
        });

        lazyElements.forEach(element => {
            observer.observe(element);
        });
    } else {
        lazyElements.forEach(element => {
            if(element.dataset.src) element.src = element.dataset.src;
        });
    }
}