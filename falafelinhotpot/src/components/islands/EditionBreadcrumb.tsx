import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/shadcn/ui/breadcrumb';
import { Separator } from '~/components/shadcn/ui/separator';

export interface EditionBreadcrumbProps {
  title: string;
  editionsHref: string;
}

export default function EditionBreadcrumb({ title, editionsHref }: EditionBreadcrumbProps) {
  return (
    <div className="mb-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={editionsHref}>Editions</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1 font-[family-name:var(--font-display)]">
              {title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Separator className="bg-border/60" />
    </div>
  );
}
