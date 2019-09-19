class BaseModel {
  static fromPlainObject (obj) {
    if (!obj) {
      return undefined
    }

    const instance = new this()
    Object.assign(instance, obj)

    return instance
  }
}

module.exports = BaseModel
