import {
  $,
  $$,
  addClass,
  addEventListener,
  doc,
  hasClass,
  isTouchScreen,
  removeClass,
} from "browser-extension-utils"

import { i } from "../messages"
import { saveTags } from "../storage"
import { type UserTag, type UserTagMeta } from "../types"

const numberLimitOfShowAllUtagsInArea = 10
let lastShownArea: HTMLElement | undefined

export function hideAllUtagsInArea(target?: HTMLElement | undefined) {
  const element = $(".utags_show_all")
  if (!element) {
    return
  }

  if (element === target || element.contains(target as Node)) {
    return
  }

  if (!target) {
    lastShownArea = undefined
  }

  for (const element of $$(".utags_show_all")) {
    // Cancel delay effect
    addClass(element, "utags_hide_all")
    removeClass(element, "utags_show_all")
    setTimeout(() => {
      removeClass(element, "utags_hide_all")
    })
  }
}

function showAllUtagsInArea(element: HTMLElement | undefined) {
  if (!element) {
    return false
  }

  const utags = $$(".utags_ul", element)
  if (utags.length > 0 && utags.length <= numberLimitOfShowAllUtagsInArea) {
    addClass(element, "utags_show_all")
    return true
  }

  return false
}

export function bindDocumentEvents() {
  const eventType = isTouchScreen() ? "touchstart" : "click"

  addEventListener(
    doc,
    eventType,
    (event: Event) => {
      let target = event.target as HTMLElement
      if (!target) {
        return
      }

      if (target.closest(".utags_ul")) {
        const captainTag = target.closest(
          ".utags_captain_tag,.utags_captain_tag2"
        ) as HTMLElement | undefined
        if (captainTag) {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()

          if (!captainTag.dataset.utags_key) {
            return
          }

          setTimeout(async () => {
            const key = captainTag.dataset.utags_key
            const tags = captainTag.dataset.utags_tags
            const meta: UserTagMeta | undefined = captainTag.dataset.utags_meta
              ? (JSON.parse(captainTag.dataset.utags_meta) as UserTagMeta)
              : undefined
            // eslint-disable-next-line no-alert
            const newTags = prompt(i("prompt.addTags"), tags)
            if (newTags !== null) {
              const newTagsArray = newTags.split(/\s*[,，]\s*/)
              await saveTags(key, newTagsArray, meta)
            }
          })
        }

        return
      }

      hideAllUtagsInArea(target)

      const targets: HTMLElement[] = []
      // Add parent elements to candidates, up to 8
      do {
        targets.push(target)
        target = target.parentElement!
      } while (targets.length <= 8 && target)

      // Start testing from the outermost parent element
      while (targets.length > 0) {
        const area = targets.pop()
        if (showAllUtagsInArea(area)) {
          if (lastShownArea === area) {
            hideAllUtagsInArea()
            return
          }

          lastShownArea = area
          return
        }
      }

      // Failed testing showAllUtagsInArea
      lastShownArea = undefined

      // TODO: delay display utags in corner of page for current page
    },
    true
  )

  addEventListener(
    doc,
    "keydown",
    (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return // 如果事件已经在进行中，则不做任何事。
      }

      if (event.key === "Escape" && $(".utags_show_all")) {
        // 按“ESC”键时要做的事。
        hideAllUtagsInArea()
        // 取消默认动作，从而避免处理两次。
        event.preventDefault()
      }
    },
    true
  )
}
