import { motion } from 'framer-motion'

const Card = ({ children, className = '', image, ...props }) => (
  <motion.div
    whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
    className={`glass-strong rounded-3xl overflow-hidden shadow-soft dark:shadow-glass ${className}`}
    {...props}
  >
    {image && (
      <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
    )}
    <div className="p-6">{children}</div>
  </motion.div>
)

export default Card