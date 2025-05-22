>
                  / {stats.total}
                </span>
              </div>
            </div>
            <div className={`w-full ${item.progressColor} rounded-full h-2 overflow-hidden`}>
              <motion.div
                className="h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                style={{ backgroundColor: item.progressBarColor }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default StatsCard