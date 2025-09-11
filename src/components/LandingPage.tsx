import React, { useState, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { 
  QrCode, 
  Users, 
  Clock, 
  Shield, 
  BarChart3, 
  Smartphone,
  CheckCircle,
  ArrowRight,
  Mail,
  Github,
  Linkedin,
  Instagram,
  Facebook,
  Star,
  Zap,
  Globe,
  Eye,
  Palette,
  Award,
  Send,
  Loader2
} from 'lucide-react'
import { organizationLogos } from '../config/organizationLogos'

const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const controls = useAnimation()

  useEffect(() => {
    setIsVisible(true)
    controls.start('visible')
  }, [controls])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || 'your_access_key_here',
          ...formData,
          subject: 'New Contact Form Submission - Scan-ttendance',
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setSubmitStatus('idle'), 5000)
    }
  }

  const features = [
    {
      icon: QrCode,
      title: 'QR Code Scanning',
      description: 'Lightning-fast QR code generation and scanning for seamless attendance tracking'
    },
    {
      icon: Users,
      title: 'Real-time Tracking',
      description: 'Monitor attendance in real-time with instant updates and notifications'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with encrypted data and reliable infrastructure'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Comprehensive reporting and analytics to gain insights into attendance patterns'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Works perfectly on all devices - desktop, tablet, and mobile'
    },
    {
      icon: Clock,
      title: 'Time Management',
      description: 'Automated time tracking with precision timing and scheduling features'
    }
  ]

  const benefits = [
    'Reduce paper waste by 95%',
    'Save 3+ hours per event',
    'Improve accuracy to 99.9%',
    'Real-time attendance insights',
    'Scalable for any event size',
    'No installation required'
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 custom-scrollbar">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50"
      >
        <div className="container-max">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <QrCode className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold gradient-text">Scan-ttendance</span>
            </motion.div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium">Features</a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium">About</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors duration-300 font-medium">Contact</a>
              <motion.a 
                href="https://github.com/JohnJandayan" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-primary inline-flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>View GitHub</span>
                <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="section-padding pt-32">
        <div className="container-max">
          <motion.div 
            className="text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-8"
            >
              <Star className="h-4 w-4" />
              <span>Trusted by various organizations</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
            >
              Modern <span className="gradient-text">QR Code</span><br />
              Attendance Tracking
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Transform your event management with our sleek, efficient, and user-friendly 
              attendance tracking system. Say goodbye to paper lists and hello to the future.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <motion.a 
                href="#features" 
                className="btn-primary inline-flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="h-5 w-5" />
                <span>Explore Features</span>
              </motion.a>
              <motion.a 
                href="#contact" 
                className="btn-secondary inline-flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail className="h-5 w-5" />
                <span>Get in Touch</span>
              </motion.a>
            </motion.div>
            
            {/* Hero Visual */}
            <motion.div 
              variants={itemVariants}
              className="relative"
            >
              <motion.div 
                className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 float-animation"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div 
                    className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white"
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <QrCode className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Scan & Track</h3>
                    <p className="text-blue-100">Instant QR code scanning</p>
                  </motion.div>
                  <motion.div 
                    className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <BarChart3 className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Real-time Data</h3>
                    <p className="text-green-100">Live attendance insights</p>
                  </motion.div>
                  <motion.div 
                    className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white"
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Shield className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Secure</h3>
                    <p className="text-purple-100">Enterprise-grade security</p>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 bg-white/50">
        <div className="container-max">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gray-600 font-medium">Trusted by university organizations</p>
          </motion.div>
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-16 lg:gap-20 transition-all duration-500"
            style={{ alignItems: 'center' }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {organizationLogos.map((org, index) => {
              const LogoElement = (
                <div 
                  className="flex items-center justify-center h-20 md:h-28 lg:h-32" 
                  style={{ 
                    minWidth: '120px',
                    ...org.positioning && {
                      marginTop: org.positioning.marginTop,
                      marginBottom: org.positioning.marginBottom,
                      marginLeft: org.positioning.marginLeft,
                      marginRight: org.positioning.marginRight,
                      paddingTop: org.positioning.paddingTop,
                      paddingBottom: org.positioning.paddingBottom,
                      paddingLeft: org.positioning.paddingLeft,
                      paddingRight: org.positioning.paddingRight,
                    }
                  }}
                >
                  <motion.img 
                    key={org.id}
                    src={org.image} 
                    alt={org.alt} 
                    className="max-h-full max-w-full hover:scale-110 transition-transform duration-300 cursor-pointer object-contain"
                    style={{ 
                      display: 'block',
                      ...org.positioning?.transform && { transform: org.positioning.transform }
                    }}
                    whileHover={{ scale: 1.1 }}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                  />
                </div>
              )

              // If the organization has a website, wrap the logo in a link
              return org.website ? (
                <motion.a
                  key={org.id}
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Visit ${org.name}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {LogoElement}
                </motion.a>
              ) : (
                LogoElement
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding">
        <div className="container-max">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Events
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage attendance efficiently and effectively
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose Scan-ttendance?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of organizations who have revolutionized their attendance tracking 
                with our cutting-edge solution.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-blue-100">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="glass rounded-2xl p-8"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="text-center">
                  <motion.div 
                    className="text-5xl font-bold mb-2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    99.9%
                  </motion.div>
                  <div className="text-blue-200 mb-6">Accuracy Rate</div>
                  <motion.div 
                    className="text-3xl font-bold mb-2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    3 hrs
                  </motion.div>
                  <div className="text-blue-200 mb-6">Time Saved Per Event</div>
                  <motion.div 
                    className="text-3xl font-bold mb-2"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    95%
                  </motion.div>
                  <div className="text-blue-200">Paper Reduction</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="section-padding bg-gray-50">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Built by <span className="gradient-text">John Jandayan</span>
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                A passionate full-stack developer and Computer Science student at Caraga State University. 
                Specialized in React, Django, and modern web technologies with a focus on creating 
                efficient, user-friendly solutions.
              </p>
              <div className="space-y-4">
                <motion.div 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Full-Stack Development</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Star className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">React & Django Expert</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Award className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">CSU Computer Science Society President</span>
                </motion.div>
              </div>
              <motion.div 
                className="flex space-x-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.a 
                  href="https://github.com/JohnJandayan" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Github className="h-5 w-5" />
                </motion.a>
                <motion.a 
                  href="https://www.linkedin.com/in/john-vianney-jandayan-b04584267/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Linkedin className="h-5 w-5" />
                </motion.a>
                <motion.a 
                  href="https://portfolio-john-jandayan.vercel.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg 
                           hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Portfolio
                </motion.a>
              </motion.div>
            </motion.div>
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="bg-white rounded-2xl p-8 shadow-xl"
                whileHover={{ scale: 1.02, rotateY: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="text-center">
                  <motion.div 
                    className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full 
                             mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    JJ
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">John Jandayan</h3>
                  <p className="text-gray-600 mb-4">Full-Stack Developer</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <motion.div 
                      className="bg-blue-50 rounded-lg p-3"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="text-2xl font-bold text-blue-600">6+</div>
                      <div className="text-gray-600">Projects</div>
                    </motion.div>
                    <motion.div 
                      className="bg-green-50 rounded-lg p-3"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="text-2xl font-bold text-green-600">14+</div>
                      <div className="text-gray-600">Months Experience</div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-padding">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              Ready to transform your attendance tracking? Let's talk!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Let's Connect</h3>
              <p className="text-gray-600 mb-8">
                Whether you're interested in implementing Scan-ttendance for your organization 
                or want to discuss a custom solution, I'd love to hear from you.
              </p>
              
              <div className="space-y-4">
                <motion.div 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Available for new opportunities</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Response within 24 hours</span>
                </motion.div>
                <motion.div 
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Globe className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Remote collaboration welcome</span>
                </motion.div>
              </div>

              <motion.div 
                className="flex space-x-4 mt-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.a 
                  href="https://github.com/JohnJandayan" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Github className="h-5 w-5" />
                </motion.a>
                <motion.a 
                  href="https://www.linkedin.com/in/john-vianney-jandayan-b04584267/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Linkedin className="h-5 w-5" />
                </motion.a>
                <motion.a 
                  href="https://www.instagram.com/jandy_jv/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Instagram className="h-5 w-5" />
                </motion.a>
                <motion.a 
                  href="https://www.facebook.com/john.jandy.1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Facebook className="h-5 w-5" />
                </motion.a>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="feature-card"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <motion.input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Your name"
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <motion.input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="your.email@example.com"
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <motion.textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                    placeholder="Tell me about your project or just say hello!"
                    whileFocus={{ scale: 1.02 }}
                  />
                </div>
                
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed 
                           flex items-center justify-center space-x-2"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </motion.button>
                
                {submitStatus === 'success' && (
                  <motion.div 
                    className="text-green-600 text-center flex items-center justify-center space-x-2"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Message sent successfully!</span>
                  </motion.div>
                )}
                
                {submitStatus === 'error' && (
                  <motion.div 
                    className="text-red-600 text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    Failed to send message. Please try again.
                  </motion.div>
                )}
              </form>
              
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500">
                  Powered by{' '}
                  <a href="https://web3forms.com" target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-700 transition-colors duration-300">
                    Web3Forms
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-max">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="flex items-center space-x-2 mb-4 md:mb-0"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <QrCode className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">Scan-ttendance</span>
            </motion.div>
            
            <div className="flex items-center space-x-6">
              <motion.a 
                href="https://github.com/JohnJandayan" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-300"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Github className="h-5 w-5" />
              </motion.a>
              <motion.a 
                href="https://www.linkedin.com/in/john-vianney-jandayan-b04584267/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-300"
                whileHover={{ scale: 1.2, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <Linkedin className="h-5 w-5" />
              </motion.a>
              <motion.a 
                href="https://portfolio-john-jandayan.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-300 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Portfolio
              </motion.a>
            </div>
          </motion.div>
          
          <motion.div 
            className="border-t border-gray-800 mt-8 pt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="text-gray-400">
              © 2025 John Jandayan. All rights reserved.
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
