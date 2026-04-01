import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicUrlBuilder } from "../../../lib/public-url";
import { getPublicListing } from "../../../lib/listing/service";
import { buildPublicListingMetadata, buildPublicListingPageModel } from "../../../lib/listing/public-page";

export default async function PublicListingPage({
  params,
}: PublicListingPageProps) {
  const { listingId } = await params;
  const listing = await getPublicListingOrNotFound(listingId);
  const page = buildPublicListingPageModel(listing);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-16 text-stone-100">
      <div className="mx-auto max-w-6xl space-y-12">
        <section className="space-y-4 border-b border-white/10 pb-8">
          <p className="font-mono text-sm text-cyan-400">Published Listing</p>
          <h1 className="max-w-4xl text-balance text-4xl font-medium tracking-tight text-stone-50 md:text-5xl">
            {page.title}
          </h1>
          <div className="flex flex-wrap gap-6 text-sm text-stone-400">
            <p>Seller: {page.sellerName}</p>
            {page.categoryName ? <p>Category: {page.categoryName}</p> : null}
            {page.publishedAt ? <p>Published: {page.publishedAt}</p> : null}
          </div>
          {page.description ? (
            <p className="max-w-3xl text-base leading-7 text-stone-300">{page.description}</p>
          ) : null}
        </section>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <div className="space-y-4">
            {page.images.length > 0 ? (
              page.images.map((item) => (
                <figure className="overflow-hidden border border-white/10 bg-neutral-900" key={item.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- Use the stable app-owned media route directly to preserve the canonical public URL contract. */}
                  <img
                    alt={item.alt}
                    className="h-auto w-full"
                    src={item.url}
                  />
                  {item.caption ? (
                    <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-stone-400">
                      {item.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))
            ) : (
              <div className="border border-dashed border-white/10 px-6 py-10 text-sm text-stone-500">
                No public media is attached to this listing yet.
              </div>
            )}
          </div>

          <aside className="space-y-8">
            <section className="space-y-3 border border-white/10 bg-neutral-900 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-stone-500">Snapshot</p>
              <div className="space-y-3 text-sm text-stone-300">
                <p className="text-2xl font-medium text-stone-50">{page.price}</p>
                <p>Quantity available: {page.quantityAvailable}</p>
                {page.condition ? <p>Condition: {page.condition}</p> : null}
                <p>Status: {page.status}</p>
              </div>
            </section>

            <section className="space-y-3 border border-white/10 bg-neutral-900 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-stone-500">Share</p>
              <a
                className="break-all text-sm text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
                href={page.shareUrl}
              >
                {page.shareUrl}
              </a>
            </section>

            {page.attributes.length > 0 ? (
              <section className="space-y-3 border border-white/10 bg-neutral-900 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-stone-500">Attributes</p>
                <dl className="space-y-3 text-sm text-stone-300">
                  {page.attributes.map((attribute) => (
                    <div className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0" key={attribute.key}>
                      <dt className="font-medium text-stone-100">{attribute.label}</dt>
                      <dd className="mt-1 text-stone-400">{attribute.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}

export async function generateMetadata({
  params,
}: PublicListingPageProps): Promise<Metadata> {
  const { listingId } = await params;
  const buildPublicUrl = createPublicUrlBuilder(await headers());
  const result = await getPublicListing(listingId, buildPublicUrl);

  if (!result.ok) {
    return {
      description: "Published listing could not be found.",
      title: "Listing Not Found | CMD Market",
    };
  }

  return buildPublicListingMetadata(result.data);
}

async function getPublicListingOrNotFound(listingId: string) {
  const buildPublicUrl = createPublicUrlBuilder(await headers());
  const result = await getPublicListing(listingId, buildPublicUrl);

  if (!result.ok) {
    notFound();
  }

  return result.data;
}
type PublicListingPageProps = {
  params: Promise<{
    listingId: string;
  }>;
};
