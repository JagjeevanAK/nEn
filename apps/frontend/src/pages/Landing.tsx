import { Link } from "react-router-dom";
import { DottedLines } from "@/components/DottedLines";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/grid/Grid";
import { GridCell } from "@/components/grid/GridCell";

const FEATURES = [
    {
        title: "Plug AI into your data",
        description: "Connect to over 500 integrations and any LLM to build powerful agents.",
        illustration: "",
    },
    {
        title: "Self-hostable",
        description: "Keep your data secure. Run on-prem or in your own cloud infrastructure.",
        illustration: "",
    },
    {
        title: "Code when you need it",
        description: "Visual builder for speed, JavaScript/Python for power. The best of both worlds.",
        illustration: "",
    },
];

const WORKFLOW_JSON = `{
  "nodes": [
    {
      "parameters": {},
      "name": "Start",
      "type": "n8n-nodes-base.start",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "jsCode": "return [{json: {message: 'Hello World'}}];"
      },
      "name": "Code",
      "type": "n8n-nodes-base.code",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ]
}`;

export default function HomePage() {
    return (
        <>
            <div className="min-h-screen bg-linear-to-br from-teal-50 via-white to-blue-50 py-6 pt-24 max-w-6xl px-3 sm:px-6 md:py-12 md:pt-28 lg:px-12 mx-auto">
                <Grid
                    columns={{
                        sm: 1,
                        md: 2,
                    }}
                    className="relative border-2 border-teal-200 rounded-lg shadow-[0_0_60px_-15px_rgba(45,212,191,0.4)] bg-white"
                >
                    <div className="absolute -top-1">
                        <div className="border-t-2 absolute w-5 h-5 -left-7 top-0.5 md:w-8 md:h-8 md:-left-4 md:top-0.5 border-teal-300" />
                        <div className="border-l-2 absolute w-5 h-5 -top-2 -left-0.5 md:w-8 md:h-8 md:-top-4 md:-left-0.5 border-teal-300" />
                    </div>
                    <GridCell className="relative border-b border-teal-100 col-span-2 px-6 py-12 xs:px-6 xs:py-12 md:p-16">
                        <DottedLines className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden text-center flex items-center justify-center" />
                        <div className="relative z-1 flex flex-col justify-center">
                            <h1 className="mb-4 text-6xl font-semibold tracking-tighter text-center md:text-7xl text-gray-800">
                                Flexible Workflow Automation
                            </h1>
                            <p className="max-w-[480px] m-auto mb-4 font-normal text-center text-gray-700 text-lg md:text-xl">
                                Build multi-step agents calling custom tools and fastest way to get AI working in your business.
                            </p>
                            <div className="w-full flex flex-wrap h-fit gap-3 2xs:gap-2 sm:gap-4 justify-center items-center">
                                <Button asChild className="text-sm sm:h-12 sm:text-base bg-teal-600 hover:bg-teal-700 text-white">
                                    <Link to="/dashboard">Get started</Link>
                                </Button>
                            </div>
                        </div>
                    </GridCell>
                    <GridCell className="border-0 h-fit col-span-2 px-6 py-14 xs:px-6 xs:py-10 md:px-9 lg:px-12">
                        <h2 className="mb-1 text-[32px] font-semibold tracking-tighter text-gray-800">
                            Run. Tweak. Repeat.
                        </h2>
                        <p className="max-w-prose text-balance text-gray-700 text-base">
                            Optimize your local and CI tasks to save years of engineering time
                            and compute.
                        </p>
                        <div className="my-8 grid h-fit gap-y-12 md:grid-cols-3 md:gap-x-8">
                            {FEATURES.map((feature) => (
                                <div key={feature.title} className="w-full">
                                    {feature.illustration}
                                    <h3 className="mt-2 text-2xl font-semibold tracking-tighter text-gray-800">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-1.5 text-gray-700 text-base md:mt-2 text-pretty">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </GridCell>
                    <GridCell className="col-span-2 px-6 py-14 xs:px-6 xs:py-10 md:px-9 lg:px-12 border-t border-teal-100">
                        <div className="flex flex-col items-start justify-between gap-y-4 md:flex-row">
                            <div className="flex flex-col gap-y-1">
                                <h2 className="text-[32px] font-semibold tracking-tighter text-gray-800">
                                    Developer-friendly
                                </h2>
                                <p className="text-gray-700 text-base text-pretty">
                                    Export your workflows to JSON and manage them with Git.
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 w-full">
                            <div className="rounded-md bg-gray-900 p-4 overflow-x-auto">
                                <pre className="text-sm text-gray-100 font-mono">
                                    <code>{WORKFLOW_JSON}</code>
                                </pre>
                            </div>
                            <span className="text-xs text-gray-500 mt-2 block">
                                Defining a workflow in JSON
                            </span>
                        </div>
                    </GridCell>
                </Grid>
            </div>
        </>
    );
}