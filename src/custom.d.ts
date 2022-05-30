import { ResourceList as MoltinResourceList } from '@moltin/sdk'

declare module '@moltin/sdk' {
  //the sdk ResourceList isn't typed correctly, missing errors
  export interface ResourceList extends MoltinResourceList {
    erorrs: any[]
  }
}
