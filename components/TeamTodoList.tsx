                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(74,222,128,0.4) 0%, rgba(74,222,128,0) 70%)',
                transform: 'translate(-50%, -50%)'
              }}
            />
            
            {/* 작은 별들 */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0, 
                  opacity: 0,
                  rotate: 0
                }}
                animate={{ 
                  x: -40 + Math.random() * 80, 
                  y: -40 + Math.random() * 80, 
                  scale: 0.5 + Math.random() * 0.5, 
                  opacity: [0, 1, 0],
                  rotate: -30 + Math.random() * 60
                }}
                transition={{ 
                  duration: 0.4 + Math.random() * 0.4,
                  delay: 0.1 + (i * 0.03),
                  ease: "easeOut" 
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  color: ['#4ade80', '#60a5fa', '#f59e0b', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 5)],
                  zIndex: 5,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <Sparkles size={16} strokeWidth={2.5} />
              </motion.div>
            ))}
            
            {/* 이모티콘들 */}
            {[...Array(5)].map((_, i) => {
              const icons = [ThumbsUp, Star, Heart, Sparkles];
              const Icon = icons[Math.floor(Math.random() * icons.length)];
              const colors = ['#4ade80', '#60a5fa', '#f59e0b', '#8b5cf6', '#ec4899'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              
              return (
                <motion.div
                  key={`icon-${i}`}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0, 
                    opacity: 0,
                    rotate: 0
                  }}
                  animate={{ 
                    x: -50 + Math.random() * 100, 
                    y: -80 + Math.random() * 40, 
                    scale: 0.7 + Math.random() * 0.5, 
                    opacity: [0, 1, 0],
                    rotate: -20 + Math.random() * 40
                  }}
                  transition={{ 
                    duration: 0.5 + Math.random() * 0.3,
                    delay: 0.15 + (i * 0.05),
                    ease: "easeOut" 
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    color: color,
                    zIndex: 5,
                    transform: 'translate(-50%, -50%)',
                    filter: `drop-shadow(0px 0px 3px ${color}70)`
                  }}
                >
                  <Icon size={20} strokeWidth={2.5} />
                </motion.div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TeamTodoList;