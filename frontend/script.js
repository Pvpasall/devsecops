// Initialize Stripe with publishable key from backend
let stripe = null;
let elements = null;
let cardElement = null;

// Initialize Stripe after getting publishable key from backend
async function initializeStripe() {
    try {
        const response = await fetch('/api/stripe-config');
        const config = await response.json();

        if (config.publishableKey) {
            stripe = Stripe(config.publishableKey);
            elements = stripe.elements();

            // Create card element
            cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                },
            });
        } else {
            console.log('Running in demo mode - no Stripe integration');
        }
    } catch (error) {
        console.log('Stripe not available - running in demo mode');
    }
}

// Variables for current purchase
let currentProduct = null;
let currentAmount = null;

// DOM elements
const modal = document.getElementById('payment-modal');
const closeBtn = document.querySelector('.close');
const submitButton = document.getElementById('submit-payment');
const paymentResult = document.getElementById('payment-result');

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function () {
    // Initialize Stripe first
    await initializeStripe();

    // Mount card element if Stripe is available
    if (cardElement) {
        cardElement.mount('#card-element');
        setupCardElementEvents();
    } else {
        // Hide card element container in demo mode
        const cardContainer = document.getElementById('card-element');
        if (cardContainer) {
            cardContainer.style.display = 'none';
        }
    }

    // Modal event listeners
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Payment form submission
    submitButton.addEventListener('click', handlePayment);
});

// Smooth scrolling to products section
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({
        behavior: 'smooth'
    });
}

// Handle product purchase
function buyProduct(productId, amount) {
    currentProduct = productId;
    currentAmount = amount;

    // Show modal
    modal.style.display = 'block';

    // Reset payment result
    paymentResult.style.display = 'none';
    paymentResult.className = '';

    // Focus on card element
    cardElement.focus();
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    currentProduct = null;
    currentAmount = null;

    // Clear card element
    cardElement.clear();

    // Reset payment result
    paymentResult.style.display = 'none';
    paymentResult.className = '';
}

// Handle payment submission
async function handlePayment() {
    if (!currentProduct || !currentAmount) {
        showPaymentResult('Erreur: Aucun produit sélectionné', 'error');
        return;
    }

    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = 'Traitement...';

    try {
        // Create payment intent on the server
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product: currentProduct,
                amount: currentAmount
            })
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }

        const result = await response.json();

        if (result.success) {
            if (result.clientSecret && stripe && cardElement) {
                // Real Stripe mode - confirm payment on client side
                const confirmResult = await stripe.confirmCardPayment(result.clientSecret, {
                    payment_method: {
                        card: cardElement,
                        billing_details: {
                            name: 'Client DevSecOps',
                        }
                    }
                });

                if (confirmResult.error) {
                    showPaymentResult(`Erreur de paiement: ${confirmResult.error.message}`, 'error');
                } else {
                    showPaymentResult('Paiement réussi ! Merci pour votre achat.', 'success');
                    setTimeout(() => closeModal(), 3000);
                }
            } else {
                // Demo mode or backend-handled payment
                showPaymentResult(result.message || 'Paiement réussi ! (Mode démo) Merci pour votre achat.', 'success');
                setTimeout(() => closeModal(), 3000);
            }
        } else {
            showPaymentResult(`Erreur: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Payment error:', error);
        showPaymentResult('Erreur de connexion au serveur de paiement', 'error');
    } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = 'Payer maintenant';
    }
}

// Show payment result
function showPaymentResult(message, type) {
    paymentResult.textContent = message;
    paymentResult.className = type;
    paymentResult.style.display = 'block';
}

// Handle card element events (only if Stripe is available)
function setupCardElementEvents() {
    if (cardElement) {
        cardElement.on('change', function (event) {
            if (event.error) {
                showPaymentResult(event.error.message, 'error');
            } else {
                paymentResult.style.display = 'none';
            }
        });
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading animation
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loading';
    loader.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        ">
            <div style="
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
            "></div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.remove();
    }
}

// API health check
async function checkApiHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('API Health:', data);
    } catch (error) {
        console.warn('API not available:', error);
    }
}

// Initialize health check
checkApiHealth(); 