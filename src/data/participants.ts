import type { Participant } from '../types/championship'

export const participants = [
  {
    "id": "michal-gershon",
    "name": "Michal Gershon",
    "poster": "michal-gershon",
    "links": [
      {
        "href": "https://www.instagram.com/michalifrah_eyebrows/",
        "label": "@michalifrah_eyebrows"
      }
    ]
  },
  {
    "id": "koral-biton",
    "name": "Koral Biton",
    "poster": "koral-biton",
    "links": [
      {
        "href": "https://www.instagram.com/koral__cosmetics1/",
        "label": "@koral__cosmetics1"
      }
    ]
  },
  {
    "id": "angela-collica",
    "name": "Angela Collica",
    "poster": "angela-collica",
    "links": [
      {
        "href": "https://www.instagram.com/angela_collica92/",
        "label": "@angela_collica92"
      }
    ]
  }
] as const satisfies readonly Participant[]
