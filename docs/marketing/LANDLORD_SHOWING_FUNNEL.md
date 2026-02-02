# Lean Canvas: Landlord Showing Funnel

**Date:** 2026-01-29
**Status:** Exploration / Alternative Pivot

---

## 1. Problem

1. Landlords get flooded with low-quality inquiries ("is it available?")
2. 95% are spam, tire-kickers, or unqualified
3. Back-and-forth scheduling wastes hours
4. Existing tools (TurboTenant, Avail) don't touch lead qualification

---

## 2. Customer Segment

- **Small landlords (1-10 units)**
- Self-managing, no property manager
- List on Craigslist, FB Marketplace, Zillow
- Time-strapped (day job, side hustle landlord)

---

## 3. Unique Value Proposition

> "Stop wasting weekends on tire-kickers. AI qualifies leads and books showings. You just show up."

---

## 4. Solution

- **Unified inbox**: CL + FB + Zillow inquiries in one place
- **AI responds instantly**, asks qualifying questions (income, pets, move-in date)
- **Qualified leads get Calendly link** to book showing
- **Landlord sees only pre-vetted, scheduled prospects**

### The Funnel

```
Listing goes live (TurboTenant/Zillow/CL/FB)
              ↓
    [US] AI handles inquiries
    [US] Qualifies: income, pets, move-in, etc.
    [US] Schedules showing via Calendly
              ↓
Landlord shows up to qualified prospect
              ↓
Application/screening (TurboTenant)
              ↓
Lease signing (TurboTenant)
```

---

## 5. Channels

| Channel | Approach |
|---------|----------|
| Reddit | r/landlord, r/realestateinvesting |
| BiggerPockets | Forums, community engagement |
| Facebook Groups | Landlord groups, local RE investor groups |
| SEO | "craigslist rental inquiry automation", "landlord lead qualification" |
| Partnerships | Complement TurboTenant/Avail users (not compete) |

---

## 6. Revenue Streams

| Plan | Price | Units |
|------|-------|-------|
| Starter | $19/mo | 1-3 units |
| Growth | $39/mo | 4-10 units |
| Alternative | $2-3/showing | Pay per result |

---

## 7. Cost Structure

| Cost | Estimate |
|------|----------|
| Twilio SMS (if used) | ~$5-10/landlord/mo |
| LLM API | ~$2-5/landlord/mo |
| Calendly API | Free tier or minimal |
| Infrastructure | Existing Skillomatic stack |

**Gross margin:** ~60-70% at $19/mo

---

## 8. Key Metrics

| Metric | What it measures |
|--------|------------------|
| Inquiries handled | Volume, automation rate |
| % qualified | Lead quality filter effectiveness |
| Showings booked | Core value delivered |
| No-show rate | Should drop vs manual scheduling |
| Time saved per listing | ROI for landlord |

---

## 9. Unfair Advantage

1. **Extension scrapes auth pages** (CL inbox, portals others can't access)
2. **Already built**: MCP + integrations + chat infrastructure
3. **Priced 10x below enterprise** (AppFolio $250/mo, Leasey.AI $$$)
4. **Complements existing free tools** vs replacing them

---

## How This Differs From Skillomatic Core

| Skillomatic | Landlord Funnel |
|-------------|-----------------|
| Horizontal platform | Vertical: landlords only |
| "Chat with your apps" | "Never answer 'is it available?' again" |
| No clear buyer | Clear buyer: self-managing landlords |
| Features-first | Outcome-first: qualified showings |

---

## Market Research Summary

### What's Well-Served (Don't Compete)
- Listing syndication (TurboTenant, Zillow - free)
- Rent collection (TurboTenant, Avail - free)
- Tenant screening (TransUnion via platforms)
- Lease templates (Avail, TurboTenant - free)

### What's NOT Well-Served (Our Gap)
- Lead qualification / response → Manual
- Showing scheduling → Manual back-and-forth
- Pre-screening conversations → Manual or ignored
- Multi-channel inbox → Scattered across CL, FB, Zillow, text
- AI for small landlords → Enterprise only ($250+/mo)

### Competitive Landscape

| Competitor | Target | Price | Gap |
|------------|--------|-------|-----|
| Leasey.AI | Property managers | $$$ | Enterprise, not small landlords |
| AppFolio Lisa | 50+ unit portfolios | $280+/mo | Overkill for 1-10 units |
| Gmail canned responses | DIY | Free | Dumb, not conversational |
| TurboTenant | Small landlords | Free | No lead qualification |

---

## Open Questions / Risks

1. **Do landlords actually want this, or do they just ignore inquiries and it's fine?**
2. **Is $19-39/mo worth it when they're already cheap?**
3. **CL/FB Messenger scraping - reliable enough?**
4. **How to reach them? Reddit/BiggerPockets is noisy.**
5. **Will they install a browser extension?**

---

## Validation Next Steps

- [ ] Post in r/landlord asking about inquiry pain
- [ ] Talk to 3 small landlords about their showing booking process
- [ ] Test CL inbox scraping reliability
- [ ] Mock up the AI conversation flow
- [ ] Calculate: how many showings/month to justify $19?

---

## Sources

- [TurboTenant - Best PM Software for Small Landlords](https://www.turbotenant.com/property-management/best-property-management-software-for-small-landlords/)
- [Baselane - Spreadsheets vs PM Software](https://www.baselane.com/resources/spreadsheets-vs-property-management-software)
- [Leasey.AI - AI Chatbot for Property Management](https://www.leasey.ai/ai-chatbot/)
- [Hemlane - Best Property Management Software](https://www.hemlane.com/resources/best-property-management-software-for-small-landlords/)
- [iPropertyManagement - PM Software for Small Landlords](https://ipropertymanagement.com/reviews/best-property-management-software-for-small-landlords)
