import {AuthoringData, loadAuthoringData} from 'xrauthor-loader'
import {createXRScene} from './init'

loadAuthoringData('assets/test').then((data: AuthoringData) => {
    createXRScene('renderCanvas', data)
})