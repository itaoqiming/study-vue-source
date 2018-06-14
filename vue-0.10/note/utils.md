# hash()
  创建了一个没有原型的对象
  e.g. Object.create(null)

# isTrueObject
  精确却低效率的对象检查
  toString.call(obj) === '[object Object]'
  toString.call(obj) 中toString() 其实不带参数，通过call指向obj