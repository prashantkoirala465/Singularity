import Experience from '@experience/Experience.js'

export default class ApiExperience {
    experience = Experience.getInstance()
    state = this.experience.state
    sceneContainer = this.experience.worlds.mainWorld.sceneContainer

    constructor() {

    }
}
