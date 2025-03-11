// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle')
const navMenu = document.querySelector('.nav-menu')

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active')
    navToggle.classList.toggle('active')
})

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        navMenu.classList.remove('active')
        navToggle.classList.remove('active')
    }
})

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute('href'))
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
            // Close mobile menu after clicking
            navMenu.classList.remove('active')
            navToggle.classList.remove('active')
        }
    })
})

// Intersection Observer for fade-in animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
        }
    })
}, observerOptions)

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section)
})

// Form submission handling
const contactForm = document.querySelector('.contact-form')
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        const formData = new FormData(contactForm)
        const data = Object.fromEntries(formData)
        
        // Here you would typically send the data to your server
        console.log('Form submitted:', data)
        
        // Show success message
        const successMessage = document.createElement('div')
        successMessage.className = 'success-message'
        successMessage.textContent = 'Thank you for your message! I will get back to you soon.'
        contactForm.appendChild(successMessage)
        
        // Reset form
        contactForm.reset()
        
        // Remove success message after 5 seconds
        setTimeout(() => {
            successMessage.remove()
        }, 5000)
    })
}

// Add scroll-based header styling
const header = document.querySelector('.header')
let lastScroll = 0

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset
    
    if (currentScroll <= 0) {
        header.classList.remove('scroll-up')
        return
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Scroll Down
        header.classList.remove('scroll-up')
        header.classList.add('scroll-down')
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Scroll Up
        header.classList.remove('scroll-down')
        header.classList.add('scroll-up')
    }
    
    lastScroll = currentScroll
})

// Add loading animation for images
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', () => {
        img.classList.add('loaded')
    })
})

// Add hover effect for skill items
document.querySelectorAll('.skill-category li').forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateX(10px)'
        item.style.transition = 'transform 0.3s ease'
    })
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateX(0)'
    })
})

// Add typing animation to hero title
const heroTitle = document.querySelector('.hero-title')
if (heroTitle) {
    const text = heroTitle.textContent
    heroTitle.textContent = ''
    let i = 0
    
    function typeWriter() {
        if (i < text.length) {
            heroTitle.textContent += text.charAt(i)
            i++
            setTimeout(typeWriter, 50)
        }
    }
    
    typeWriter()
}

// Publications Tab Switching
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
});

// Experience section collapsible boxes
document.querySelectorAll('.timeline-content').forEach(box => {
    box.addEventListener('click', () => {
        // Close all other boxes
        document.querySelectorAll('.timeline-content').forEach(otherBox => {
            if (otherBox !== box) {
                otherBox.classList.remove('expanded');
            }
        });
        // Toggle current box
        box.classList.toggle('expanded');
    });
});

// Recognition items collapsible functionality
document.querySelectorAll('.recognition-item').forEach(item => {
    item.addEventListener('click', () => {
        // Close other items
        document.querySelectorAll('.recognition-item').forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('expanded');
            }
        });
        // Toggle current item
        item.classList.toggle('expanded');
    });
}); 