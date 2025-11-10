export function installClickGuard() {
  if (typeof document === "undefined") return;

  document.addEventListener(
    "click",
    (event: Event) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("[data-action],button,[role=\"button\"],a[role=\"button\"]") as HTMLElement | null;
      if (button && (button as HTMLButtonElement | { disabled?: boolean }).disabled) {
        console.warn("Button disabled:", button);
      }
    },
    true,
  );

  const suspects = Array.from(
    document.querySelectorAll<HTMLElement>('[class*="overlay"],[class*="modal"],[class*="backdrop"]'),
  );

  suspects.forEach((element) => {
    const computed = getComputedStyle(element);
    const zIndex = computed.zIndex;
    const pointerEvents = computed.pointerEvents;
    const ariaHidden = element.getAttribute("aria-hidden");
    const { opacity } = element.style;
    const { visibility } = element.style;

    if (
      pointerEvents !== "none" &&
      (ariaHidden === "true" || opacity === "0" || visibility === "hidden")
    ) {
      element.style.pointerEvents = "none";
      console.warn("Pointer-events disabled on hidden overlay:", element, { zIndex });
    }
  });
}
