import type { Partner } from '../types/championship'

export const partners = [
  {
    "id": "beauty-panda",
    "name": "Beauty Panda",
    "poster": "beauty-panda",
    "links": [
      {
        "href": "https://www.instagram.com/beautypanda.it/",
        "label": "@beautypanda.it"
      }
    ]
  }
] as const satisfies readonly Partner[]
