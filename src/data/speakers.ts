import type { Speaker } from '../types/championship'

export const speakers = [
  {
    "id": "silvia-amadei",
    "name": "Silvia Amadei",
    "poster": "silvia-amadei",
    "links": [
      {
        "href": "https://www.instagram.com/silvia.amadei_masterlash/",
        "label": "@silvia.amadei_masterlash"
      },
      {
        "href": "https://www.instagram.com/sa.academylash/",
        "label": "@sa.academylash"
      }
    ],
    "factIds": [
      "fact0",
      "fact1",
      "fact2",
      "fact3"
    ]
  },
  {
    "id": "sol-shola-beker",
    "name": "Sol Shola Beker",
    "poster": "sol-shola-beker",
    "links": [
      {
        "href": "https://www.instagram.com/shuli_tattooremoval/",
        "label": "@shuli_tattooremoval"
      }
    ],
    "factIds": [
      "fact0",
      "fact1"
    ]
  },
  {
    "id": "isabella-paunescu",
    "name": "Isabella Paunescu",
    "poster": "isabella-paunescu",
    "links": [
      {
        "href": "https://www.instagram.com/regal_lashes_/",
        "label": "@regal_lashes_"
      }
    ],
    "factIds": [
      "fact0",
      "fact1"
    ]
  },
  {
    "id": "nadezhda-pichugina",
    "name": "Nadezhda Pichugina",
    "poster": "nadezhda-pichugina",
    "links": [
      {
        "href": "https://www.instagram.com/pichugina_lashes/",
        "label": "@pichugina_lashes"
      }
    ],
    "factIds": [
      "fact0",
      "fact1",
      "fact2"
    ]
  },
  {
    "id": "ekaterina-dvoeriadkina",
    "name": "Ekaterina Dvoeriadkina",
    "poster": "ekaterina-dvoeriadkina",
    "links": [
      {
        "href": "https://www.instagram.com/ekaterina_dvoeriadkina/",
        "label": "@ekaterina_dvoeriadkina"
      }
    ],
    "factIds": [
      "fact0",
      "fact1",
      "fact2"
    ]
  }
] as const satisfies readonly Speaker[]
